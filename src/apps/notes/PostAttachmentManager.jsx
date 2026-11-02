import { useEffect, useRef, useState } from 'react';

import {
  createOfficialFile,
  getOfficialFile,
  uploadOfficialFile,
  setPostAttachment,
} from '../../services/backendDomainService';

import {
  NOTE_ATTACHMENT_TYPES,
  validateNoteAttachment,
  validateNoteAttachments,
} from '../../services/storage/noteAttachmentContract';

import { MAX_POST_ATTACHMENTS } from '../../services/storage/managedFileContract';
import { translate as t } from '../../shared/i18n/i18n';

/* === GERENCIAMENTO DE ANEXOS === */
export default function PostAttachmentManager({ post, onBusy, onRefresh, onPending }) {
  /* ----- Estados e referências ----- */
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(null);

  const active = useRef(null);
  const mounted = useRef(false);
  const selection = useRef(null);

  /* ----- Validação dos anexos ----- */
  const parsed = validateNoteAttachments(post.attachments ?? []);

  /* ----- Sincronização de pendências ----- */
  useEffect(() => {
    onPending(Boolean(pending));
  }, [pending, onPending]);

  /* ----- Ciclo de vida ----- */
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      active.current?.abort();
    };
  }, []);

  /* === RECONCILIAÇÃO DOS ANEXOS === */
  /* ----- Atualização da publicação ----- */
  async function refreshPost() {
    const result = await onRefresh();
    const latest = Array.isArray(result)
      ? result.find((item) => item.id === post.id)
      : result;

    return latest?.id === post.id ? latest : post;
  }

  /* ----- Limpeza da seleção ----- */
  function clearPending() {
    setPending(null);

    if (selection.current) selection.current.value = '';

    onPending(false);
  }

  /* ----- Atualização da lista ----- */
  async function refreshAttachments() {
    if (active.current) return;

    const controller = new AbortController();
    active.current = controller;

    setBusy(true);
    onBusy(true);

    try {
      const latest = await refreshPost();

      if (!mounted.current) return;

      if (
        pending &&
        !(latest.attachments ?? []).some((file) => file.resourceId === pending.resourceId)
      ) {
        setMessage(
          t('O arquivo ainda não foi vinculado. Use Enviar e vincular anexo para concluir.'),
        );
      } else {
        if (pending) clearPending();

        setMessage(t('Anexos atualizados.'));
      }
    } catch {
      if (mounted.current) {
        setMessage(t('Não foi possível atualizar os anexos. Tente novamente.'));
      }
    } finally {
      active.current = null;

      if (mounted.current) setBusy(false);

      onBusy(false);
    }
  }

  /* === OPERAÇÕES DE ANEXOS === */
  /* ----- Vinculação e remoção ----- */
  async function mutate(resourceId, remove = false) {
    if (active.current || !parsed.ok) return;

    /* ----- Verificação do limite ----- */
    if (
      !remove &&
      !parsed.attachments.some((file) => file.resourceId === resourceId) &&
      parsed.attachments.length >= MAX_POST_ATTACHMENTS
    ) {
      setMessage(t('Limite de cinco anexos por publicação.'));
      return;
    }

    /* ----- Inicialização da operação ----- */
    const controller = new AbortController();
    active.current = controller;

    setBusy(true);
    onBusy(true);
    setMessage('');

    try {
      /* ----- Registro e envio do arquivo ----- */
      if (!remove && pending) {
        const id = pending.resourceId;
        let item;

        try {
          item = (await getOfficialFile(id, { signal: controller.signal })).item;
        } catch (error) {
          if (error.code !== 'NOT_FOUND') throw error;

          item = (
            await createOfficialFile(
              {
                id,
                name: pending.file.name,
                mimeType: pending.blob?.type ?? pending.file.type,
                size: pending.file.size,
                purpose: 'attachment',
                visibility: 'private',
              },
              { signal: controller.signal },
            )
          ).item;
        }

        if (item?.resourceId !== id) throw Error('INVALID_FILE');

        if (item.state !== 'available') {
          item = (
            await uploadOfficialFile(id, item.revision, pending.blob ?? pending.file, {
              signal: controller.signal,
            })
          ).item;
        }

        if (item?.resourceId !== id || item.state !== 'available') {
          throw Error('INVALID_UPLOAD');
        }

        resourceId = id;
      }

      /* ----- Reconciliação da publicação ----- */
      const latest = await refreshPost();

      if (controller.signal.aborted || !mounted.current) return;

      if (
        !remove &&
        (latest.attachments ?? []).some((file) => file.resourceId === resourceId)
      ) {
        clearPending();
        setMessage(t('Anexos atualizados.'));
        return;
      }

      /* ----- Atualização do vínculo ----- */
      const result = await setPostAttachment(
        {
          postId: post.id,
          resourceId,
          updatedAt: latest.updatedAt,
        },
        {
          signal: controller.signal,
          remove,
        },
      );

      if (
        result?.success !== true ||
        result.postId !== post.id ||
        result.resourceId !== resourceId
      ) {
        throw Error('INVALID_ATTACHMENT');
      }

      await refreshPost();

      if (mounted.current && !controller.signal.aborted) {
        clearPending();
        setMessage(t('Anexos atualizados.'));
      }
    } catch {
      if (mounted.current) {
        setMessage(
          t(
            'Operação não confirmada. Atualize a lista antes de tentar novamente; o arquivo selecionado foi preservado.',
          ),
        );
      }
    } finally {
      active.current = null;

      if (mounted.current) setBusy(false);

      onBusy(false);
    }
  }

  /* === INTERFACE === */
  return (
    <section className="notes-app__attachments" aria-label={t('Gerenciar anexos')}>
      {/* ----- Informações dos anexos ----- */}
      <p>
        {t(
          'Até cinco anexos de 10 MB: PDF, texto, PNG, JPEG ou WebP. Anexos só ficam públicos com a publicação.',
        )}
      </p>

      {/* ----- Lista de anexos ----- */}
      {!parsed.ok ? (
        <p role="alert">{t('Lista de anexos inválida. Atualize a lista.')}</p>
      ) : (
        <ul>
          {parsed.attachments.map((file) => (
            <li key={file.resourceId}>
              {file.name}{' '}
              <button
                type="button"
                disabled={busy}
                onClick={() => mutate(file.resourceId, true)}
              >
                {t('Remover vínculo')}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ----- Seleção e validação do arquivo ----- */}
      <input
        ref={selection}
        aria-label={t('Selecionar anexo')}
        type="file"
        accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
        disabled={
          busy ||
          Boolean(pending) ||
          !parsed.ok ||
          parsed.attachments.length >= MAX_POST_ATTACHMENTS
        }
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (!file) return;

          const resourceId = crypto.randomUUID();
          const extension = file.name.split('.').at(-1)?.toLowerCase();

          const mimeType =
            !file.type || file.type === 'application/octet-stream'
              ? (NOTE_ATTACHMENT_TYPES[extension] ?? file.type)
              : file.type;

          const validation = validateNoteAttachment({
            resourceId,
            name: file.name,
            mimeType,
            size: file.size,
          });

          if (!validation.ok || file.size < 1) {
            event.target.value = '';
            setMessage(t('Arquivo inválido, formato não permitido ou maior que 10 MB.'));
            return;
          }

          const blob = mimeType === file.type ? file : file.slice(0, file.size, mimeType);

          setPending({ resourceId, file, blob });
          setMessage('');
        }}
      />

      {/* ----- Arquivo pendente ----- */}
      {pending && (
        <>
          <p>{pending.file.name}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => mutate(pending.resourceId)}
          >
            {t('Enviar e vincular anexo')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              clearPending();
            }}
          >
            {t('Cancelar seleção')}
          </button>
        </>
      )}

      {/* ----- Mensagens de operação ----- */}
      {message && <p role="status">{message}</p>}

      {/* ----- Atualização manual ----- */}
      <button type="button" disabled={busy} onClick={refreshAttachments}>
        {t('Atualizar lista')}
      </button>
    </section>
  );
}
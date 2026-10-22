import { useEffect, useRef, useState } from 'react';
import {
  createOfficialFile,
  getOfficialFile,
  uploadOfficialFile,
  setPostAttachment,
} from '../../services/backendDomainService';
import {
  validateNoteAttachment,
  validateNoteAttachments,
} from '../../services/storage/noteAttachmentContract';
import { MAX_POST_ATTACHMENTS } from '../../services/storage/managedFileContract';
import { translate as t } from '../../shared/i18n/i18n';

/* === Vínculos editoriais; uma identidade estável por arquivo selecionado === */
export default function PostAttachmentManager({ post, onBusy, onRefresh, onPending }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(null);
  const active = useRef(null);
  const mounted = useRef(false);
  const selection = useRef(null);
  const parsed = validateNoteAttachments(post.attachments ?? []);
  useEffect(() => {
    onPending(Boolean(pending));
  }, [pending, onPending]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort();
    };
  }, []);

  async function mutate(resourceId, remove = false) {
    if (active.current || !parsed.ok) return;
    if (
      !remove &&
      !parsed.attachments.some((file) => file.resourceId === resourceId) &&
      parsed.attachments.length >= MAX_POST_ATTACHMENTS
    ) {
      setMessage(t('Limite de cinco anexos por publicação.'));
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    onBusy(true);
    setMessage('');
    try {
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
                mimeType: pending.file.type,
                size: pending.file.size,
                purpose: 'attachment',
                visibility: 'private',
              },
              { signal: controller.signal },
            )
          ).item;
        }
        if (item?.resourceId !== id) throw Error('INVALID_FILE');
        if (item.state !== 'available')
          item = (
            await uploadOfficialFile(id, item.revision, pending.file, { signal: controller.signal })
          ).item;
        if (item?.resourceId !== id || item.state !== 'available') throw Error('INVALID_UPLOAD');
        resourceId = id;
      }
      const result = await setPostAttachment(
        { postId: post.id, resourceId, updatedAt: post.updatedAt },
        { signal: controller.signal, remove },
      );
      if (result?.success !== true || result.postId !== post.id || result.resourceId !== resourceId)
        throw Error('INVALID_ATTACHMENT');
      if (mounted.current) {
        setPending(null);
        if (selection.current) selection.current.value = '';
        setMessage(t('Anexos atualizados.'));
      }
      await onRefresh();
    } catch {
      if (mounted.current)
        setMessage(
          t(
            'Operação não confirmada. Atualize a lista antes de tentar novamente; o arquivo selecionado foi preservado.',
          ),
        );
    } finally {
      active.current = null;
      if (mounted.current) setBusy(false);
      onBusy(false);
    }
  }
  return (
    <section className="notes-app__attachments" aria-label={t('Gerenciar anexos')}>
      <p>
        {t(
          'Até cinco anexos de 10 MB: PDF, texto, PNG, JPEG ou WebP. Anexos só ficam públicos com a publicação.',
        )}
      </p>
      {!parsed.ok ? (
        <p role="alert">{t('Lista de anexos inválida. Atualize a lista.')}</p>
      ) : (
        <ul>
          {parsed.attachments.map((file) => (
            <li key={file.resourceId}>
              {file.name}{' '}
              <button type="button" disabled={busy} onClick={() => mutate(file.resourceId, true)}>
                {t('Remover vínculo')}
              </button>
            </li>
          ))}
        </ul>
      )}
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
          const validation = validateNoteAttachment({
            resourceId,
            name: file.name,
            mimeType: file.type,
            size: file.size,
          });
          if (!validation.ok || file.size < 1) {
            event.target.value = '';
            setMessage(t('Arquivo inválido, formato não permitido ou maior que 10 MB.'));
            return;
          }
          setPending({ resourceId, file });
          setMessage('');
        }}
      />
      {pending && (
        <>
          <p>
            {pending.file.name} — {pending.resourceId}
          </p>
          <button type="button" disabled={busy} onClick={() => mutate(pending.resourceId)}>
            {t('Enviar e vincular anexo')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setPending(null);
              if (selection.current) selection.current.value = '';
            }}
          >
            {t('Cancelar seleção')}
          </button>
        </>
      )}
      {message && <p role="status">{message}</p>}
      <button type="button" disabled={busy} onClick={onRefresh}>
        {t('Atualizar lista')}
      </button>
    </section>
  );
}

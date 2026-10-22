import { useRef, useState } from 'react';
import {
  createOfficialFile,
  getOfficialFile,
  getOfficialFiles,
  uploadOfficialFile,
  updateOfficialFile,
} from '../../services/backendDomainService';
import { validateManagedFileMetadata } from '../../services/storage/managedFileContract';
import { validateNoteAttachment } from '../../services/storage/noteAttachmentContract';
import { isValidRevision } from '../../services/revisionContract';
import { translate as t } from '../../shared/i18n/i18n';
import useAdministrativeResource from './useAdministrativeResource';

const validItem = (item) =>
  validateManagedFileMetadata(item).ok &&
  isValidRevision(item.revision) &&
  ['catalog', 'attachment'].includes(item.purpose);
async function loadPage(options) {
  const result = await getOfficialFiles(options);
  if (
    !Array.isArray(result?.items) ||
    result.items.length > 100 ||
    result.items.some((item) => !validItem(item)) ||
    !(
      result.nextOffset === null ||
      (Number.isSafeInteger(result.nextOffset) && result.nextOffset > options.offset)
    )
  )
    throw Error('INVALID_FILES');
  return result;
}
/* === Arquivos oficiais: identidade de upload estável, publicação e exclusão explícitas === */
export default function AdminFiles({ authorized, instanceId }) {
  const [pending, setPending] = useState(null);
  const [validation, setValidation] = useState('');
  const selection = useRef(null);
  const resource = useAdministrativeResource({
    authorized,
    instanceId,
    dirty: Boolean(pending),
    loadPage,
  });
  async function upload(event) {
    event.preventDefault();
    if (!pending || !authorized || resource.busy) return;
    const result = await resource.perform(async (signal) => {
      let item;
      try {
        item = (await getOfficialFile(pending.id, { signal })).item;
      } catch (error) {
        if (error.code !== 'NOT_FOUND') throw error;
        item = (
          await createOfficialFile(
            {
              id: pending.id,
              name: pending.file.name,
              size: pending.file.size,
              mimeType: pending.file.type,
              purpose: 'catalog',
              visibility: 'private',
            },
            { signal },
          )
        ).item;
      }
      if (
        !validItem(item) ||
        item.resourceId !== pending.id ||
        item.name !== pending.file.name ||
        item.size !== pending.file.size ||
        item.mimeType !== pending.file.type ||
        item.purpose !== 'catalog'
      )
        throw Error('INVALID_FILE');
      if (item.state !== 'available')
        item = (await uploadOfficialFile(pending.id, item.revision, pending.file, { signal })).item;
      if (!validItem(item) || item.resourceId !== pending.id || item.state !== 'available')
        throw Object.assign(Error('INVALID_CONFIRMATION'), { code: 'HTTP_RESULT_UNKNOWN' });
      return item;
    }, 'Alterações salvas.');
    if (result) {
      setPending(null);
      if (selection.current) selection.current.value = '';
      await resource.load(resource.offset, true);
    }
  }
  async function change(item, remove = false) {
    if (!authorized || resource.busy) return;
    const visibility = item.visibility === 'public' ? 'private' : 'public';
    if (
      !window.confirm(
        t(
          remove
            ? 'Excluir este arquivo oficial e seus vínculos definitivamente?'
            : 'Confirmar alteração da visibilidade deste arquivo?',
        ),
      )
    )
      return;
    const result = await resource.perform(async (signal) => {
      const next = (
        await updateOfficialFile(item.resourceId, item.revision, visibility, { signal, remove })
      ).item;
      if (
        !validItem(next) ||
        next.resourceId !== item.resourceId ||
        next.revision <= item.revision ||
        (remove ? next.state !== 'deleted' : next.visibility !== visibility)
      )
        throw Object.assign(Error('INVALID_CONFIRMATION'), { code: 'HTTP_RESULT_UNKNOWN' });
      return next;
    }, 'Alterações salvas.');
    if (result) await resource.load(resource.offset, true);
  }
  return (
    <section className="ws-admin-content">
      <h3>{t('Arquivos oficiais')}</h3>
      <p>
        {t(
          'Arquivos pessoais permanecem exclusivamente no navegador do visitante. Administração não fornece acesso remoto a esses dados.',
        )}
      </p>
      <button
        type="button"
        disabled={!authorized || resource.busy}
        onClick={() => resource.load(0)}
      >
        {t('Atualizar lista')}
      </button>
      {resource.message && <p role="status">{t(resource.message)}</p>}
      {validation && <p role="alert">{t(validation)}</p>}
      <form onSubmit={upload}>
        <fieldset disabled={!authorized || resource.busy}>
          <label>
            {t('Selecionar arquivo oficial')}
            <input
              ref={selection}
              type="file"
              accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
              disabled={Boolean(pending)}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const id = crypto.randomUUID();
                if (
                  !validateNoteAttachment({
                    resourceId: id,
                    name: file.name,
                    mimeType: file.type,
                    size: file.size,
                  }).ok ||
                  file.size < 1
                ) {
                  setValidation('Formato não suportado ou arquivo maior que 10 MB.');
                  event.target.value = '';
                  return;
                }
                setValidation('');
                setPending({ id, file });
              }}
            />
          </label>
          {pending && (
            <>
              <p>
                {pending.file.name} · {pending.id}
              </p>
              <button type="submit">{t('Enviar arquivo oficial')}</button>
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm(t('Descartar seleção de arquivo pendente?'))) return;
                  setPending(null);
                  if (selection.current) selection.current.value = '';
                }}
              >
                {t('Cancelar seleção')}
              </button>
            </>
          )}
        </fieldset>
      </form>
      <ul>
        {resource.items.map((item) => (
          <li key={item.resourceId}>
            <strong>{item.name}</strong> · {item.state} · {item.visibility} · {item.resourceId}
            {item.state === 'available' && item.purpose === 'catalog' && (
              <button type="button" disabled={resource.busy} onClick={() => change(item)}>
                {t(item.visibility === 'public' ? 'Despublicar' : 'Publicar')}
              </button>
            )}
            {item.state !== 'deleted' && (
              <button type="button" disabled={resource.busy} onClick={() => change(item, true)}>
                {t('Excluir')}
              </button>
            )}
          </li>
        ))}
      </ul>
      {resource.nextOffset !== null && (
        <button
          type="button"
          disabled={!authorized || resource.busy}
          onClick={() => resource.load(resource.nextOffset)}
        >
          {t('Próxima página')}
        </button>
      )}
      {resource.offset > 0 && (
        <button
          type="button"
          disabled={!authorized || resource.busy}
          onClick={() => resource.load(Math.max(0, resource.offset - 100))}
        >
          {t('Página anterior')}
        </button>
      )}
    </section>
  );
}

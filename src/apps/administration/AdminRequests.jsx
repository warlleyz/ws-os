import { useState } from 'react';
import { getPrivateRequests, updatePrivateRequest } from '../../services/backendDomainService';
import { REQUEST_STATUSES, validatePrivateRequest } from '../../services/privateRequestContract';
import { translate as t } from '../../shared/i18n/i18n';
import useAdministrativeResource from './useAdministrativeResource';

const labels = {
  new: 'Nova',
  in_review: 'Em análise',
  awaiting_response: 'Aguardando resposta',
  responded: 'Respondida',
  completed: 'Concluída',
  archived: 'Arquivada',
};
async function loadPage(options) {
  const result = await getPrivateRequests(options);
  if (
    !Array.isArray(result?.items) ||
    result.items.length > 100 ||
    result.items.some((item) => !validatePrivateRequest(item).ok) ||
    !(
      result.nextOffset === null ||
      (Number.isSafeInteger(result.nextOffset) && result.nextOffset > options.offset)
    )
  )
    throw Error('INVALID_REQUESTS');
  return result;
}
/* === Pedidos privados: status não confirma reunião nem cria evento público === */
export default function AdminRequests({ authorized, instanceId }) {
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('new');
  const resource = useAdministrativeResource({
    authorized,
    instanceId,
    dirty: Boolean(selected && status !== selected.status),
    loadPage,
  });
  function select(item) {
    if (
      selected &&
      status !== selected.status &&
      !window.confirm(t('Descartar alterações não salvas?'))
    )
      return;
    setSelected(item);
    setStatus(item.status);
  }
  async function change(remove = false) {
    if (!selected || !authorized || resource.busy) return;
    if (
      remove &&
      !window.confirm(t('Excluir esta solicitação e seus dados pessoais definitivamente?'))
    )
      return;
    if (!remove && !window.confirm(t('Confirmar alteração do status desta solicitação?'))) return;
    const result = await resource.perform(async (signal) => {
      const next = await updatePrivateRequest(
        {
          id: selected.id,
          revision: selected.revision,
          ...(remove ? { confirm: true } : { status }),
        },
        { signal, remove },
      );
      if (
        remove
          ? next?.deleted !== true || next.id !== selected.id
          : next?.item?.id !== selected.id ||
            next.item.status !== status ||
            next.item.revision !== selected.revision + 1 ||
            !validatePrivateRequest(next.item).ok
      )
        throw Object.assign(Error('INVALID_CONFIRMATION'), { code: 'HTTP_RESULT_UNKNOWN' });
      return next;
    }, 'Alterações salvas.');
    if (result) {
      setSelected(null);
      await resource.load(resource.offset, true);
    }
  }
  return (
    <section className="ws-admin-content">
      <h3>{t('Solicitações privadas')}</h3>
      <p>{t('Alterar o status não confirma reunião e não cria evento público.')}</p>
      <button
        type="button"
        disabled={!authorized || resource.busy}
        onClick={() => resource.load(0)}
      >
        {t('Atualizar lista')}
      </button>
      {resource.message && <p role="status">{t(resource.message)}</p>}
      <ul>
        {resource.items.map((item) => (
          <li key={item.id}>
            <button type="button" disabled={resource.busy} onClick={() => select(item)}>
              {item.name} · {t(labels[item.status])}
            </button>
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
      {selected && authorized && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void change();
          }}
        >
          <p>
            {selected.name} · {selected.email}
          </p>
          <p className="ws-admin-content__body">{selected.message}</p>
          {selected.requestedAt && (
            <p>
              {selected.requestedAt} · {selected.timezone}
            </p>
          )}
          {selected.retentionUntil && (
            <p>
              {t('Retenção até')}: {selected.retentionUntil}
            </p>
          )}
          <label>
            {t('Status')}
            <select
              value={status}
              disabled={resource.busy}
              onChange={(event) => setStatus(event.target.value)}
            >
              {REQUEST_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {t(labels[value])}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={resource.busy || status === selected.status}>
            {t('Salvar')}
          </button>
          <button type="button" disabled={resource.busy} onClick={() => change(true)}>
            {t('Excluir')}
          </button>
        </form>
      )}
      {!authorized && selected && (
        <p role="status">{t('Sessão encerrada. O formulário foi preservado nesta janela.')}</p>
      )}
    </section>
  );
}

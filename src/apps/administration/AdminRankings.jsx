import {
  getAdministrativeScores,
  deleteAdministrativeScore,
} from '../../services/backendDomainService';
import { translate as t } from '../../shared/i18n/i18n';
import useAdministrativeResource from './useAdministrativeResource';

async function loadPage(options) {
  const result = await getAdministrativeScores(options);
  if (
    !Array.isArray(result?.scores) ||
    result.scores.length > 100 ||
    result.scores.some(
      (row) =>
        !['snake', 'flappy'].includes(row.game) ||
        !/^[a-f0-9]{64}$/.test(row.visitorHash) ||
        typeof row.alias !== 'string' ||
        !Number.isSafeInteger(row.score) ||
        row.score < 1,
    )
  )
    throw Error('INVALID_SCORES');
  return { items: result.scores, nextOffset: null };
}
/* === Moderação explícita das pontuações existentes, sem confiar no navegador === */
export default function AdminRankings({ authorized, instanceId }) {
  const resource = useAdministrativeResource({ authorized, instanceId, dirty: false, loadPage });
  async function remove(row) {
    if (
      !authorized ||
      resource.busy ||
      !window.confirm(t('Excluir esta pontuação pública definitivamente?'))
    )
      return;
    const result = await resource.perform(async (signal) => {
      const next = await deleteAdministrativeScore(
        { game: row.game, visitorHash: row.visitorHash, score: row.score, confirm: true },
        { signal },
      );
      if (next?.deleted !== true) throw Error('INVALID_CONFIRMATION');
      return next;
    }, 'Alterações salvas.');
    if (result) await resource.load(0, true);
  }
  return (
    <section className="ws-admin-content">
      <h3>{t('Moderação de rankings')}</h3>
      <p>{t('Pontuações do navegador não comprovam uma partida legítima.')}</p>
      <button
        type="button"
        disabled={!authorized || resource.busy}
        onClick={() => resource.load(0)}
      >
        {t('Atualizar lista')}
      </button>
      {resource.message && <p role="status">{t(resource.message)}</p>}
      <ul>
        {resource.items.map((row) => (
          <li key={row.game + row.visitorHash}>
            {row.game} · {row.alias} · {row.score}
            <button type="button" disabled={resource.busy} onClick={() => remove(row)}>
              {t('Excluir')}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

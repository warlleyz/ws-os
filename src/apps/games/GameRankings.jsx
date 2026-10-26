import { useEffect, useRef, useState } from 'react';
import { executeJsonRequest } from '../../services/httpRequestContract';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import WallyTurnstile from '../../features/wally/WallyTurnstile';
import { useGameRecord } from './gameRecords';
import { RANKING_GAME_LIMITS } from '../../services/publicContentContract';

/* === VALIDAÇÃO DA PROJEÇÃO PÚBLICA, SEM ACEITAR CONTEÚDO ADMINISTRATIVO === */
const maximum = RANKING_GAME_LIMITS;
const validAlias = (value) =>
  typeof value === 'string' && /^[\p{L}\p{N} _-]{2,24}$/u.test(value.trim());
const validScore = (game, score) =>
  Object.hasOwn(maximum, game) &&
  Number.isSafeInteger(score) &&
  score > 0 &&
  score <= maximum[game];
function publicRows(value, game) {
  if (
    !Array.isArray(value) ||
    value.length > 20 ||
    value.some(
      (row) =>
        !row ||
        Object.keys(row).some((key) => !['alias', 'score'].includes(key)) ||
        !validAlias(row.alias) ||
        !validScore(game, row.score),
    )
  )
    throw Error('INVALID_RANKING');
  return value.map(({ alias, score }) => ({ alias, score }));
}

/* === LEITURAS E ENVIO VOLUNTÁRIO COM RESULTADO CONFIRMADO === */
export default function GameRankings({ game, paused = false }) {
  useLocale();
  const { record } = useGameRecord(game, 0, false);
  const [rows, setRows] = useState([]);
  const [alias, setAlias] = useState('');
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState('');
  const [listError, setListError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [submittedScore, setSubmittedScore] = useState(null);
  const [verification, setVerification] = useState(0);
  const readRef = useRef(null);
  const writeRef = useRef(null);
  const attemptRef = useRef(null);
  const enabled = import.meta.env.VITE_RANKINGS_ENABLED === 'true';
  useEffect(
    () => () => {
      readRef.current?.abort();
      writeRef.current?.abort();
    },
    [],
  );

  async function load() {
    if (!enabled || paused || writeRef.current) return;
    readRef.current?.abort();
    const controller = new AbortController();
    readRef.current = controller;
    setLoading(true);
    setListError('');
    try {
      const { response, payload } = await executeJsonRequest(
        '/api/rankings?game=' + encodeURIComponent(game),
        { cache: 'no-store' },
        { signal: controller.signal },
      );
      if (!response.ok) throw Error('UNAVAILABLE');
      const next = publicRows(payload?.scores, game);
      if (!controller.signal.aborted) {
        setRows(next);
        setLoaded(true);
      }
    } catch {
      if (!controller.signal.aborted) {
        setRows([]);
        setLoaded(false);
        setListError('Ranking indisponível. Seu recorde local está preservado.');
      }
    } finally {
      if (readRef.current === controller) {
        readRef.current = null;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (!enabled || paused || writeRef.current || !token) return;
    const input = attemptRef.current ?? { game, alias: alias.trim(), score: record };
    if (!validAlias(input.alias) || !validScore(input.game, input.score)) return;
    const previousUncertain = uncertain;
    attemptRef.current = input;
    readRef.current?.abort();
    readRef.current = null;
    setLoading(false);
    const controller = new AbortController();
    writeRef.current = controller;
    setSubmittedScore(input.score);
    setBusy(true);
    setMessage('');
    let mayHaveWritten = true;
    try {
      const { response, payload } = await executeJsonRequest(
        '/api/rankings',
        {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...input, turnstileToken: token }),
        },
        { operation: 'write', signal: controller.signal },
      );
      if (!response.ok) {
        mayHaveWritten = previousUncertain || response.status >= 500;
        throw Error('UNAVAILABLE');
      }
      if (payload?.accepted !== true) throw Error('UNCONFIRMED');
      if (!controller.signal.aborted) {
        attemptRef.current = null;
        setUncertain(false);
        setMessage('Recorde enviado.');
        writeRef.current = null;
        await load();
      }
    } catch {
      if (!controller.signal.aborted) {
        if (!mayHaveWritten) attemptRef.current = null;
        setUncertain(mayHaveWritten);
        setMessage('Ranking indisponível. Seu recorde local está preservado.');
      }
    } finally {
      if (!controller.signal.aborted) {
        writeRef.current = null;
        setBusy(false);
        setToken(null);
        setVerification((value) => value + 1);
      }
    }
  }
  if (!enabled || !Object.hasOwn(maximum, game)) return null;
  return (
    <section className="ws-app__card">
      <h3>{t('Ranking público')}</h3>
      <p>
        {t(
          'Envio opcional. Use um apelido público, sem dados pessoais. Pontuações do navegador estão sujeitas a fraude.',
        )}
      </p>
      <button type="button" onClick={load} disabled={busy || loading || paused}>
        {t('Atualizar ranking')}
      </button>
      {loading && <p role="status">{t('Carregando')}</p>}
      {loaded && !rows.length && <p role="status">{t('Nenhuma pontuação publicada.')}</p>}
      <ol>
        {rows.map((row, index) => (
          <li key={index}>
            {row.alias} · {row.score}
          </li>
        ))}
      </ol>
      {(validScore(game, record) || uncertain) && (
        <form onSubmit={submit}>
          <label>
            {t('Apelido público')}
            <input
              value={alias}
              onChange={(event) => setAlias(event.target.value)}
              minLength={2}
              maxLength={24}
              required
              disabled={busy || paused}
              readOnly={uncertain}
            />
          </label>
          <p>
            {t('Recorde local')}: {busy || uncertain ? submittedScore : record}
          </p>
          {uncertain && (
            <p role="status">
              {t(
                'Resultado do envio não confirmado. Uma nova tentativa enviará o mesmo apelido e pontuação.',
              )}
            </p>
          )}
          <WallyTurnstile key={verification} onTokenChange={setToken} action="public-write" />
          <button type="submit" disabled={busy || paused || !token || !validAlias(alias)}>
            {t('Enviar recorde')}
          </button>
        </form>
      )}
      {message && <p role="status">{t(message)}</p>}
      {listError && <p role="alert">{t(listError)}</p>}
    </section>
  );
}

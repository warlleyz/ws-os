import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crown,
  Medal,
  RefreshCw,
  Send,
  Trophy,
} from 'lucide-react';

import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import WallyTurnstile from '../../../features/wally/WallyTurnstile';

import { useGameRecord } from './gameRecords';
import {
  fetchGameRanking,
  isPublicRankingEnabled,
  isValidRankingAlias,
  submitGameRanking,
} from './rankingService';
import {
  getRankingConfig,
  isValidRankingScore,
  supportsPublicRanking,
} from './rankingConfig';

import './GameRankings.css';

/* === FORMATAÇÃO DAS PONTUAÇÕES === */
function formatScore(score) {
  return new Intl.NumberFormat('pt-BR').format(score);
}

/* === IDENTIFICAÇÃO DAS POSIÇÕES === */
function RankingPosition({ position }) {
  if (position === 1) {
    return <Crown size={18} aria-hidden="true" />;
  }

  if (position <= 3) {
    return <Medal size={17} aria-hidden="true" />;
  }

  return String(position).padStart(2, '0');
}

/* === LISTA DE CLASSIFICAÇÃO === */
function RankingList({ rows }) {
  if (!rows.length) {
    return (
      <div className="ws-ranking__empty">
        <Trophy size={22} aria-hidden="true" />
        <p>{t('Nenhuma pontuação publicada.')}</p>
      </div>
    );
  }

  return (
    <ol className="ws-ranking__list">
      {rows.map((row, index) => {
        const position = index + 1;

        return (
          <li
            key={`${row.alias}-${index}`}
            className={`ws-ranking__item ${position <= 3
                ? `ws-ranking__item--top-${position}`
                : ''
              }`}
          >
            <span className="ws-ranking__position">
              <RankingPosition position={position} />
            </span>

            <span
              className="ws-ranking__player"
              title={row.alias}
            >
              {row.alias}
            </span>

            <strong className="ws-ranking__score">
              {formatScore(row.score)}
            </strong>
          </li>
        );
      })}
    </ol>
  );
}

/* === RANKING PÚBLICO === */
export default function GameRankings({
  game,
  paused = false,
}) {
  useLocale();

  /* ----- CONFIGURAÇÃO ----- */
  const config = getRankingConfig(game);
  const enabled = isPublicRankingEnabled();
  const supported = supportsPublicRanking(game);

  /* ----- RECORDE LOCAL ----- */
  const { record, error: recordError } = useGameRecord(
    game,
    0,
    false,
  );

  /* ----- CLASSIFICAÇÃO ----- */
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [listError, setListError] = useState('');

  /* ----- PUBLICAÇÃO ----- */
  const [formOpen, setFormOpen] = useState(false);
  const [alias, setAlias] = useState('');
  const [token, setToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [submittedScore, setSubmittedScore] = useState(null);
  const [verification, setVerification] = useState(0);

  /* ----- REQUISIÇÕES ----- */
  const readRef = useRef(null);
  const writeRef = useRef(null);
  const attemptRef = useRef(null);

  /* === CANCELAMENTO AO DESMONTAR === */
  useEffect(() => {
    return () => {
      readRef.current?.abort();
      writeRef.current?.abort();
    };
  }, []);

  /* === CONSULTA DA CLASSIFICAÇÃO === */
  async function loadRanking() {
    if (
      !enabled ||
      !supported ||
      paused ||
      writeRef.current
    ) {
      return;
    }

    readRef.current?.abort();

    const controller = new AbortController();

    readRef.current = controller;
    setLoading(true);
    setListError('');

    try {
      const results = await fetchGameRanking(
        game,
        controller.signal,
      );

      if (!controller.signal.aborted) {
        setRows(results);
        setLoaded(true);
      }
    } catch {
      if (!controller.signal.aborted) {
        setRows([]);
        setLoaded(false);
        setListError(
          'Ranking indisponível. Seu recorde local está preservado.',
        );
      }
    } finally {
      if (readRef.current === controller) {
        readRef.current = null;

        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
  }

  /* === ENVIO DO RECORDE === */
  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !enabled ||
      !supported ||
      paused ||
      writeRef.current ||
      !token
    ) {
      return;
    }

    const submission = attemptRef.current ?? {
      gameId: game,
      alias: alias.trim(),
      score: record,
    };

    if (
      !isValidRankingAlias(submission.alias) ||
      !isValidRankingScore(
        submission.gameId,
        submission.score,
      )
    ) {
      return;
    }

    const previousUncertain = uncertain;

    attemptRef.current = submission;

    readRef.current?.abort();
    readRef.current = null;

    setLoading(false);

    const controller = new AbortController();

    writeRef.current = controller;

    setSubmitting(true);
    setSubmittedScore(submission.score);
    setMessage('');

    try {
      await submitGameRanking({
        ...submission,
        turnstileToken: token,
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        attemptRef.current = null;

        setUncertain(false);
        setMessage('Recorde enviado.');

        writeRef.current = null;

        await loadRanking();
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        const mayHaveWritten =
          previousUncertain ||
          error.message !== 'INVALID_RANKING_SUBMISSION';

        if (!mayHaveWritten) {
          attemptRef.current = null;
        }

        setUncertain(mayHaveWritten);

        setMessage(
          mayHaveWritten
            ? 'Não foi possível confirmar o envio. Seu recorde local está preservado.'
            : 'Não foi possível enviar o recorde. Verifique os dados e tente novamente.',
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        writeRef.current = null;

        setSubmitting(false);
        setToken(null);
        setVerification((value) => value + 1);
      }
    }
  }

  /* === DISPONIBILIDADE === */
  if (!enabled || !supported || !config) {
    return null;
  }

  const hasRecord = isValidRankingScore(game, record);
  const canSubmit = hasRecord || uncertain;

  return (
    <section className="ws-ranking">
      {/* === CABEÇALHO === */}
      <header className="ws-ranking__header">
        <div className="ws-ranking__heading">
          <span className="ws-ranking__eyebrow">
            {t('CLASSIFICAÇÃO GLOBAL')}
          </span>

          <h3>
            <Trophy size={19} aria-hidden="true" />
            {t('Ranking')}
          </h3>
        </div>

        <button
          type="button"
          className="ws-ranking__refresh"
          onClick={() => void loadRanking()}
          disabled={paused || loading || submitting}
          aria-label={t('Atualizar ranking')}
          title={t('Atualizar ranking')}
        >
          <RefreshCw
            size={17}
            className={loading ? 'ws-ranking__spinning' : ''}
            aria-hidden="true"
          />
        </button>
      </header>

      {/* === RECORDE PESSOAL === */}
      <div className="ws-ranking__personal">
        <span>{t('SEU RECORDE')}</span>

        <strong>
          {record === null ? '—' : formatScore(record)}
        </strong>

        <small>{t(config.name)}</small>
      </div>

      {/* === CLASSIFICAÇÃO === */}
      <div className="ws-ranking__content">
        {loading && (
          <p className="ws-ranking__status" role="status">
            {t('Carregando classificação...')}
          </p>
        )}

        {listError && (
          <p className="ws-ranking__error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            {t(listError)}
          </p>
        )}

        {!loaded && !loading && !listError && (
          <p className="ws-ranking__status">
            {t('Atualize para consultar a classificação.')}
          </p>
        )}

        {loaded && !loading && (
          <RankingList rows={rows} />
        )}
      </div>

      {/* === PUBLICAÇÃO DO RECORDE === */}
      {canSubmit && (
        <div className="ws-ranking__publication">
          <button
            type="button"
            className="ws-ranking__publication-toggle"
            onClick={() => setFormOpen((value) => !value)}
            aria-expanded={formOpen}
            disabled={submitting}
          >
            <span>
              <Send size={15} aria-hidden="true" />
              {t('Publicar meu recorde')}
            </span>

            {formOpen ? (
              <ChevronUp size={16} aria-hidden="true" />
            ) : (
              <ChevronDown size={16} aria-hidden="true" />
            )}
          </button>

          {formOpen && (
            <form
              className="ws-ranking__form"
              onSubmit={(event) => void handleSubmit(event)}
            >
              <p className="ws-ranking__form-description">
                {t(
                  'O envio é opcional. Utilize somente um apelido público.',
                )}
              </p>

              {/* ----- APELIDO ----- */}
              <label className="ws-ranking__field">
                <span>{t('Apelido público')}</span>

                <input
                  type="text"
                  value={alias}
                  onChange={(event) => setAlias(event.target.value)}
                  minLength={2}
                  maxLength={24}
                  autoComplete="off"
                  required
                  disabled={paused || submitting}
                  readOnly={uncertain}
                  placeholder={t('Seu apelido')}
                />
              </label>

              {/* ----- PONTUAÇÃO ----- */}
              <div className="ws-ranking__submission-score">
                <span>{t('Pontuação')}</span>

                <strong>
                  {formatScore(
                    submitting || uncertain
                      ? submittedScore ?? record
                      : record,
                  )}
                </strong>
              </div>

              {uncertain && (
                <p className="ws-ranking__notice" role="status">
                  {t(
                    'O envio não foi confirmado. Uma nova tentativa utilizará o mesmo apelido e pontuação.',
                  )}
                </p>
              )}

              {/* ----- VERIFICAÇÃO ----- */}
              <WallyTurnstile
                key={verification}
                onTokenChange={setToken}
                action="public-write"
              />

              <button
                type="submit"
                className="ws-ranking__submit"
                disabled={
                  paused ||
                  submitting ||
                  !token ||
                  !isValidRankingAlias(alias)
                }
              >
                <Send size={15} aria-hidden="true" />

                {submitting
                  ? t('Enviando...')
                  : t('Enviar recorde')}
              </button>
            </form>
          )}
        </div>
      )}

      {/* === MENSAGENS === */}
      {message && (
        <p className="ws-ranking__message" role="status">
          {message === 'Recorde enviado.' && (
            <CheckCircle2 size={16} aria-hidden="true" />
          )}

          {t(message)}
        </p>
      )}

      {recordError && (
        <p className="ws-ranking__error" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          {t('Não foi possível salvar o recorde local.')}
        </p>
      )}

      {/* === INTEGRIDADE DAS PONTUAÇÕES === */}
      <footer className="ws-ranking__footer">
        {t(
          'Pontuações públicas são enviadas pelo navegador e podem estar sujeitas a manipulação.',
        )}
      </footer>
    </section>
  );
}
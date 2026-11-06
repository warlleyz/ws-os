import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Bot,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';

import { executeSystemAction } from '../../services/actionService';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { useSystem } from '../../core/useSystem';
import { getAppDefinition } from '../../core/appRegistry';
import Tooltip from '../../shared/components/Tooltip';
import useSharedWallyConversation from './useSharedWallyConversation';
import WallyMessageText from './WallyMessageText';
import WallyTurnstile from './WallyTurnstile';
import './WallyPanel.css';

/* === CONFIGURAÇÃO DO PAINEL === */
const SUGGESTIONS = [
  { label: 'Projetos', question: 'Quais projetos posso explorar?' },
  { label: 'Currículo', question: 'Onde encontro o currículo?' },
  { label: 'Contato', question: 'Como entrar em contato?' },
  { label: 'Configurações', question: 'Como personalizar o WS OS?' },
];

const WALLY_FACE = `${import.meta.env.BASE_URL}assets/wally/wally-rosto.webp`;

/* ----- Erros sem indicação indevida de fallback local ----- */
function getPanelErrorMessage(code) {
  if (code === 'VERIFICATION_REQUIRED' || code === 'VERIFICATION_FAILED') {
    return 'Conclua a verificação de segurança para enviar sua pergunta.';
  }

  if (code === 'RATE_LIMIT_EXCEEDED') {
    return 'O limite de consultas foi atingido. Tente novamente mais tarde.';
  }

  if (code === 'AI_TIMEOUT') {
    return 'O Gemini demorou para responder. Tente novamente.';
  }

  if (code === 'AI_DISABLED') {
    return 'A integração com o Gemini está desativada.';
  }

  return 'Não foi possível consultar o Gemini. Tente novamente.';
}

/* === PAINEL COMPACTO DO WALLY === */
export default function WallyPanel({ setWallyOpen }) {
  useLocale();
  const { run } = useSystem();

  const [question, setQuestion] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [verificationKey, setVerificationKey] = useState(0);

  const {
    messages,
    status,
    lastError,
    remoteEnabled,
    sendMessage,
    clearConversation,
    cancelResponse,
    maxQuestionLength,
  } = useSharedWallyConversation();

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const isResponding = status === 'responding';

  /* ----- Acompanhar o histórico compartilhado ----- */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'auto',
    });
  }, [messages, status]);

  /* ----- Abrir aplicativo público autorizado ----- */
  async function open(appId) {
    const app = getAppDefinition(appId);
    if (!app?.public) return;

    const result = await executeSystemAction(
      { id: 'app.open', params: { appId } },
      { run, context: 'wally', origin: 'system' },
    );

    if (result.ok) setWallyOpen(false);
  }

  /* ----- Enviar pergunta exclusivamente ao Gemini ----- */
  async function ask(value) {
    if (isResponding || typeof value !== 'string') return;

    const text = value.trim();
    if (!text) return;

    const token = turnstileToken;
    const sent = await sendMessage(text, { turnstileToken: token });

    if (remoteEnabled && token) {
      setTurnstileToken(null);
      setVerificationKey((current) => current + 1);
    }

    if (sent) {
      setQuestion((current) => (current.trim() === text ? '' : current));
      inputRef.current?.focus();
    } else {
      /* ----- Preservar também perguntas feitas pelos atalhos ----- */
      setQuestion((current) => current.trim() || text);
    }
  }

  /* ----- Limpar conversa e entrada ----- */
  function handleClear() {
    clearConversation();
    setQuestion('');
    inputRef.current?.focus();
  }

  /* === INTERFACE DO PAINEL === */
  return (
    <section className="taskbar-wally ws-wally" role="region" aria-label="Wally">
      {/* ----- Cabeçalho ----- */}
      <header className="ws-wally__header">
        <span className="ws-wally__avatar" aria-hidden="true">
          <img src={WALLY_FACE} alt="" />
        </span>

        <div className="ws-wally__identity">
          <strong>Wally</strong>
          <small>
            <span className="ws-wally__status-dot" data-status={status} />
            {status === 'error'
              ? t('Conexão indisponível')
              : remoteEnabled
                ? 'Gemini'
                : t('IA desativada')}
          </small>
        </div>

        <div className="ws-wally__header-actions">
          <Tooltip content={t('Limpar conversa')}>
            <button
              type="button"
              aria-label={t('Limpar conversa')}
              disabled={messages.length === 0 && !isResponding}
              onClick={handleClear}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </Tooltip>

          <Tooltip content={t('Fechar Wally')}>
            <button
              type="button"
              aria-label={t('Fechar Wally')}
              onClick={() => setWallyOpen(false)}
            >
              <X size={17} aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* ----- Histórico e apresentação ----- */}
      <div
        className="ws-wally__messages"
        ref={scrollRef}
        role="log"
        aria-label={t('Conversa com Wally')}
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && !isResponding ? (
          <div className="ws-wally__welcome">
            <span className="ws-wally__welcome-symbol" aria-hidden="true">
              <Sparkles size={24} />
            </span>
            <h2>{t('Como posso ajudar?')}</h2>
            <p>{t('Pergunte sobre projetos, habilidades e conteúdos do WS OS.')}</p>

            <span className="ws-wally__suggestion-title">
              {t('Experimente perguntar')}
            </span>
            <div className="ws-wally__suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  disabled={isResponding}
                  onClick={() => void ask(t(suggestion.question))}
                >
                  <CircleHelp size={14} aria-hidden="true" />
                  <span>{t(suggestion.label)}</span>
                  <ChevronRight size={13} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ws-wally__conversation">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`ws-wally__message ws-wally__message--${message.role}`}
              >
                {message.role === 'assistant' && (
                  <span className="ws-wally__message-avatar" aria-hidden="true">
                    <Bot size={15} />
                  </span>
                )}

                <div className="ws-wally__bubble">
                  <p>
                    {message.role === 'assistant' ? (
                      <WallyMessageText text={t(message.text)} />
                    ) : (
                      message.text
                    )}
                  </p>

                  {message.cancelled && (
                    <small>{t('Resposta cancelada')}</small>
                  )}
                  {message.failed && (
                    <small>{t('Não foi possível obter a resposta.')}</small>
                  )}

                  {/* ----- Ações autorizadas preservadas para mensagens existentes ----- */}
                  {message.role === 'assistant' &&
                    message.actions
                      ?.filter(
                        (action) =>
                          action.type === 'open-app' &&
                          getAppDefinition(action.appId)?.public,
                      )
                      .map((action) => (
                        <button
                          key={action.appId}
                          type="button"
                          className="ws-wally__app-action"
                          onClick={() => void open(action.appId)}
                        >
                          <ExternalLink size={13} aria-hidden="true" />
                          {t(getAppDefinition(action.appId).name)}
                          <ChevronRight size={13} aria-hidden="true" />
                        </button>
                      ))}
                </div>
              </article>
            ))}

            {isResponding && (
              <div className="ws-wally__responding" role="status">
                <span className="ws-wally__typing-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="ws-wally__responding-label">
                  {t('Wally está preparando uma resposta...')}
                </span>
                <button type="button" onClick={cancelResponse}>
                  <Square size={12} aria-hidden="true" />
                  {t('Cancelar')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ----- Campo de escrita e informações ----- */}
      <div className="ws-wally__composer-area">
        {lastError && (
          <p className="ws-wally__verification-info" role="alert">
            {t(getPanelErrorMessage(lastError))}
          </p>
        )}

        <details className="ws-wally__privacy">
          <summary>{t('Capacidades e privacidade')}</summary>
          <p>
            {t(
              remoteEnabled
                ? 'Suas perguntas e até cinco pares de mensagens anteriores são enviados ao Google Gemini com contexto público do portfólio. Não envie dados sensíveis. Se a IA falhar, nenhuma resposta será inventada.'
                : 'A integração com o Gemini está desativada. Não é possível enviar perguntas neste momento.',
            )}
          </p>
        </details>

        {/* ----- Verificação de segurança ----- */}
        {remoteEnabled && (
          <div className="ws-wally__turnstile">
            <WallyTurnstile
              key={verificationKey}
              onTokenChange={setTurnstileToken}
            />
          </div>
        )}

        <form
          className="ws-wally__composer"
          onSubmit={(event) => {
            event.preventDefault();
            void ask(question);
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={question}
            maxLength={maxQuestionLength}
            aria-label={t('Pergunte ao Wally')}
            placeholder={t('Pergunte ao Wally...')}
            onChange={(event) => setQuestion(event.target.value)}
          />

          <Tooltip content={t('Enviar')}>
            <button
              type="submit"
              disabled={!question.trim() || isResponding || !remoteEnabled}
              aria-label={t('Enviar')}
            >
              <ArrowUp size={17} aria-hidden="true" />
            </button>
          </Tooltip>
        </form>

        <div className="ws-wally__composer-footer">
          <span>
            <MessageCircle size={12} aria-hidden="true" />
            {remoteEnabled ? 'Gemini' : t('IA desativada')}
          </span>
          <button type="button" onClick={() => void open('wally-extended')}>
            {t('Wally Estendido')}
            <ExternalLink size={12} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

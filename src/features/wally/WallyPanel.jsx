import {
  ArrowUp,
  Bot,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Trash2,
  X,
  LoaderCircle,
  Square,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { useSystem } from '../../core/useSystem';
import { openApp } from '../../core/appManager';
import { getAppDefinition } from '../../core/appRegistry';
import Tooltip from '../../shared/components/Tooltip';
import useSharedWallyConversation from './useSharedWallyConversation';
import WallyTurnstile from './WallyTurnstile';
import { getWallyErrorMessage } from './wallyErrorMessages';

import './WallyPanel.css';

const SUGGESTIONS = [
  { label: 'Projetos', question: 'Quais projetos posso explorar?' },
  { label: 'Currículo', question: 'Onde encontro o currículo?' },
  { label: 'Contato', question: 'Como entrar em contato?' },
  { label: 'Configurações', question: 'Como personalizar o WS OS?' },
];

export default function WallyPanel({ setWallyOpen }) {
  useLocale();
  const { run } = useSystem();

  const [question, setQuestion] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [verificationKey, setVerificationKey] = useState(0);
  const {
    messages,
    status,
    provider,
    lastError,
    remoteEnabled,
    sendMessage,
    clearConversation,
    cancelResponse,
  } = useSharedWallyConversation();

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!messages.length) return;

    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'auto',
    });
  }, [messages]);

  function open(appId) {
    const app = getAppDefinition(appId);
    if (!app) return;

    const opened = run(openApp, appId, { origin: 'system' });
    if (opened) setWallyOpen(false);
  }

  async function ask(value) {
    if (status === 'responding') return;

    const token = turnstileToken;

    const sent = await sendMessage(value, {
      turnstileToken: token,
    });

    if (remoteEnabled && token) {
      setTurnstileToken(null);
      setVerificationKey((current) => current + 1);
    }

    if (!sent) return;

    setQuestion('');
    inputRef.current?.focus();
  }

  return (
    <section className="taskbar-wally ws-wally" role="region" aria-label="Wally">
      <header className="ws-wally__header">
        <span className="ws-wally__avatar">
          <Bot size={22} aria-hidden="true" />
        </span>

        <div className="ws-wally__identity">
          <strong>Wally</strong>
          <small>
            <span className="ws-wally__status-dot" />
            {t('Assistente local')}
          </small>
        </div>

        <div className="ws-wally__header-actions">
          <Tooltip content={t('Limpar conversa')}>
            <button
              type="button"
              aria-label={t('Limpar conversa')}
              disabled={messages.length === 0}
              onClick={() => {
                clearConversation();
                setQuestion('');
              }}
            >
              <Trash2 size={16} />
            </button>
          </Tooltip>

          <Tooltip content={t('Fechar Wally')}>
            <button
              type="button"
              aria-label={t('Fechar Wally')}
              onClick={() => setWallyOpen(false)}
            >
              <X size={17} />
            </button>
          </Tooltip>
        </div>
      </header>

      <div className="ws-wally__messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="ws-wally__welcome">
            <span className="ws-wally__welcome-symbol">
              <Sparkles size={25} aria-hidden="true" />
            </span>

            <h2>{t('Como posso ajudar?')}</h2>

            <p>{t('Posso orientar você pelos aplicativos e conteúdos do WS OS.')}</p>

            <span className="ws-wally__suggestion-title">{t('Experimente perguntar')}</span>

            <div className="ws-wally__suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => ask(suggestion.question)}
                >
                  <CircleHelp size={14} aria-hidden="true" />
                  {t(suggestion.label)}
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
                  {message.cancelled && <small role="status">{t('Resposta cancelada')}</small>}
                  <p>{message.role === 'assistant' ? t(message.text) : message.text}</p>

                  {message.actions?.map((action) => {
                    const app = getAppDefinition(action.appId);
                    if (!app) return null;

                    return (
                      <button
                        key={action.appId}
                        type="button"
                        className="ws-wally__app-action"
                        onClick={() => open(action.appId)}
                      >
                        <ExternalLink size={13} />
                        {t(app.name)}
                        <ChevronRight size={13} />
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {status === 'responding' && (
        <div className="ws-wally__responding" role="status" aria-live="polite">
          <LoaderCircle size={15} className="ws-wally__loading-icon" aria-hidden="true" />

          <span>{t('Wally está preparando uma resposta...')}</span>

          <button type="button" onClick={cancelResponse}>
            <Square size={12} aria-hidden="true" />
            {t('Cancelar')}
          </button>
        </div>
      )}

      <div className="ws-wally__composer-area">
        {remoteEnabled && (
          <WallyTurnstile key={verificationKey} onTokenChange={setTurnstileToken} />
        )}

        {lastError && (
          <p className="ws-wally__verification-info" role="status">
            {t(getWallyErrorMessage(lastError))}
          </p>
        )}
        <form
          className="ws-wally__composer"
          onSubmit={(event) => {
            event.preventDefault();
            ask(question);
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={question}
            maxLength={1000}
            aria-label={t('Pergunte ao Wally')}
            placeholder={t('Pergunte ao Wally...')}
            onChange={(event) => setQuestion(event.target.value)}
          />

          <Tooltip content={t('Enviar')}>
            <button
              type="submit"
              disabled={!question.trim() || status === 'responding'}
              aria-label={t('Enviar')}
            >
              <ArrowUp size={17} />
            </button>
          </Tooltip>
        </form>

        <div className="ws-wally__composer-footer">
          <span>
            <MessageCircle size={12} aria-hidden="true" />
            {t(provider === 'gemini' ? 'Gemini' : 'Respostas locais')}
          </span>

          <button type="button" onClick={() => open('wally-extended')}>
            {t('Wally Estendido')}
            <ExternalLink size={12} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

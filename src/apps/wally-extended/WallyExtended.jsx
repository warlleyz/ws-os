
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Bot,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react';

import {
  translate as t,
  useLocale,
} from '../../shared/i18n/i18n';

import { getAppDefinition } from '../../core/appRegistry';
import { useSystem } from '../../core/useSystem';
import { openApp } from '../../core/appManager';

import useSharedWallyConversation from '../../features/wally/useSharedWallyConversation';
import WallyTurnstile from '../../features/wally/WallyTurnstile';
import { getWallyErrorMessage } from '../../features/wally/wallyErrorMessages';

import '../../styles/apps.css';
import '../../features/wally/WallyPanel.css';
import './WallyExtended.css';

const SUGGESTIONS = [
  {
    label: 'Projetos',
    question: 'Quais projetos posso explorar?',
  },
  {
    label: 'Sobre mim',
    question: 'Conte um pouco sobre o desenvolvedor.',
  },
  {
    label: 'Habilidades',
    question: 'Quais tecnologias o desenvolvedor utiliza?',
  },
  {
    label: 'Contato',
    question: 'Como posso entrar em contato?',
  },
];

export default function WallyExtended() {
  useLocale();

  const { run } = useSystem();

  const [question, setQuestion] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [verificationKey, setVerificationKey] = useState(0);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const {
    messages,
    status,
    sendMessage,
    cancelResponse,
    clearConversation,
    provider,
    remoteEnabled,
    lastError,
    maxQuestionLength,
  } = useSharedWallyConversation();

  const isResponding = status === 'responding';
  const isGemini = provider === 'gemini';

  useEffect(() => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, status]);

  async function submitQuestion(value) {
    if (isResponding || typeof value !== 'string') {
      return;
    }

    const text = value.trim();

    if (!text) return;

    const token = turnstileToken;

    const sent = await sendMessage(text, {
      turnstileToken: token,
    });

    if (remoteEnabled && token) {
      setTurnstileToken(null);
      setVerificationKey((current) => current + 1);
    }

    if (sent) {
      setQuestion('');
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    void submitQuestion(question);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      if (event.nativeEvent.isComposing) return;

      event.preventDefault();
      void submitQuestion(question);
    }
  }

  function handleClear() {
    clearConversation();
    setQuestion('');
    inputRef.current?.focus();
  }

  function openRelatedApp(appId) {
    const app = getAppDefinition(appId);

    if (!app?.public) return;

    run(openApp, appId, {
      origin: 'wally-extended',
    });
  }

  return (
    <article className="desktop-window__content ws-wally-extended">

      {/* Cabeçalho */}
      <header className="wally-ext__header">
        <div className="wally-ext__brand">
          <div className="wally-ext__avatar">
            <Bot size={26} strokeWidth={1.8} />
          </div>

          <div className="wally-ext__brand-info">
            <div className="wally-ext__title-row">
              <h2>Wally</h2>
              <span className="wally-ext__version">
                WS AI
              </span>
            </div>

            <p>
              {t('Seu assistente dentro do WS OS')}
            </p>
          </div>
        </div>

        <div className="wally-ext__header-actions">
          <div
            className="wally-ext__mode"
            title={t('Modo de resposta atual')}
          >
            <span className="wally-ext__status-dot" />

            {isGemini ? 'Gemini' : t('Local')}
          </div>

          <button
            type="button"
            className="wally-ext__icon-button"
            onClick={handleClear}
            disabled={messages.length === 0 && !isResponding}
            title={t('Limpar conversa')}
            aria-label={t('Limpar conversa')}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </header>

      {/* Histórico */}
      <div
        ref={scrollRef}
        className="wally-ext__conversation"
        role="log"
        aria-label={t('Conversa com Wally')}
        aria-live="polite"
        aria-relevant="additions"
      >

        {messages.length === 0 && !isResponding && (
          <div className="wally-ext__welcome">
            <div className="wally-ext__welcome-icon">
              <Sparkles size={32} strokeWidth={1.6} />
            </div>

            <span className="wally-ext__eyebrow">
              WS OS INTELLIGENCE
            </span>

            <h3>
              {t('Como posso ajudar você?')}
            </h3>

            <p>
              {t(
                'Explore projetos, conheça o desenvolvedor e descubra as funcionalidades do WS OS.',
              )}
            </p>

            <div className="wally-ext__suggestion-grid">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  className="wally-ext__suggestion"
                  onClick={() => {
                    void submitQuestion(suggestion.question);
                  }}
                >
                  <MessageSquare
                    size={16}
                    aria-hidden="true"
                  />

                  <span>
                    {t(suggestion.label)}
                  </span>

                  <ArrowUp
                    size={13}
                    className="wally-ext__suggestion-arrow"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="wally-ext__messages">
            {messages.map((message) => {
              const isUser = message.role === 'user';

              return (
                <div
                  key={message.id}
                  className={`wally-ext__message ${isUser
                      ? 'wally-ext__message--user'
                      : 'wally-ext__message--assistant'
                    }`}
                >
                  {!isUser && (
                    <div className="wally-ext__message-avatar">
                      <Bot size={17} />
                    </div>
                  )}

                  <div className="wally-ext__message-content">
                    <span className="wally-ext__message-author">
                      {isUser ? t('Você') : 'Wally'}
                    </span>

                    <div className="wally-ext__bubble">
                      <p>
                        {isUser
                          ? message.text
                          : t(message.text)}
                      </p>

                      {message.cancelled && (
                        <span className="wally-ext__cancelled">
                          {t('Resposta cancelada')}
                        </span>
                      )}

                      {!isUser &&
                        message.actions
                          ?.filter(
                            (action) =>
                              action.type === 'open-app' &&
                              getAppDefinition(action.appId)?.public,
                          )
                          .map((action) => {
                            const app = getAppDefinition(
                              action.appId,
                            );

                            return (
                              <button
                                key={action.appId}
                                type="button"
                                className="wally-ext__app-link"
                                onClick={() =>
                                  openRelatedApp(action.appId)
                                }
                              >
                                <ExternalLink size={14} />
                                {t(app.name)}
                              </button>
                            );
                          })}
                    </div>

                    {!isUser && message.provider && (
                      <span className="wally-ext__message-provider">
                        {message.provider === 'gemini'
                          ? 'Gemini'
                          : t('Resposta local')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Carregamento */}
        {isResponding && (
          <div
            className="wally-ext__thinking"
            role="status"
          >
            <div className="wally-ext__message-avatar">
              <Bot size={17} />
            </div>

            <div className="wally-ext__thinking-content">
              <LoaderCircle
                size={16}
                className="wally-ext__spinner"
              />

              <span>
                {t('Wally está preparando uma resposta...')}
              </span>

              <button
                type="button"
                onClick={cancelResponse}
              >
                <Square size={12} />
                {t('Cancelar')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="wally-ext__bottom">

        {status === 'error' && (
          <div className="wally-ext__notice" role="alert">
            {t('Não foi possível gerar uma resposta.')}
          </div>
        )}

        {lastError && (
          <div className="wally-ext__notice" role="status">
            {t(getWallyErrorMessage(lastError))}
          </div>
        )}

        {remoteEnabled && (
          <div className="wally-ext__turnstile">
            <WallyTurnstile
              key={verificationKey}
              onTokenChange={setTurnstileToken}
            />
          </div>
        )}

        <form
          className="wally-ext__composer"
          onSubmit={handleSubmit}
        >
          <textarea
            ref={inputRef}
            value={question}
            maxLength={maxQuestionLength}
            rows={2}
            placeholder={t('Pergunte qualquer coisa ao Wally...')}
            aria-label={t('Pergunte ao Wally')}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            onKeyDown={handleKeyDown}
          />

          <div className="wally-ext__composer-toolbar">
            <span className="wally-ext__character-count">
              {question.length}/{maxQuestionLength}
            </span>

            <span className="wally-ext__composer-hint">
              Enter {t('para enviar')}
            </span>

            <button
              type="submit"
              className="wally-ext__send-button"
              disabled={!question.trim() || isResponding}
              aria-label={t('Enviar mensagem')}
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </form>

        <footer className="wally-ext__footer">
          <span>
            <ShieldCheck size={13} />

            {remoteEnabled
              ? t('Verificação de segurança ativa')
              : t('Modo local')}
          </span>

          <span>
            <CheckCircle2 size={13} />
            WS OS
          </span>
        </footer>
      </div>
    </article>
  );
}

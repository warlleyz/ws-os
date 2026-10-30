import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  Maximize2,
  MessageSquare,
  Minimize2,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react';
import { executeSystemAction } from '../../services/actionService';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { getAppDefinition } from '../../core/appRegistry';
import { useSystem } from '../../core/useSystem';
import useSharedWallyConversation from '../../features/wally/useSharedWallyConversation';
import WallyTurnstile from '../../features/wally/WallyTurnstile';
import { getWallyErrorMessage } from '../../features/wally/wallyErrorMessages';
import './WallyExtended.css';

/* === RECURSOS VISUAIS === */
/* ----- Imagens públicas do Wally ----- */
const WALLY_FACE = `${import.meta.env.BASE_URL}assets/wally/wally-rosto.svg`;
const WALLY_BODY = `${import.meta.env.BASE_URL}assets/wally/wally-corpo.svg`;

/* ----- Perguntas sugeridas ----- */
const SUGGESTIONS = [
  { label: 'Projetos', question: 'Quais projetos posso explorar?' },
  { label: 'Sobre mim', question: 'Conte um pouco sobre o desenvolvedor.' },
  { label: 'Habilidades', question: 'Quais tecnologias o desenvolvedor utiliza?' },
  { label: 'Contato', question: 'Como posso entrar em contato?' },
];

/* === IDENTIDADE DO ASSISTENTE === */
function WallyAvatar({ className = '' }) {
  return (
    <span className={`wally-ext__avatar ${className}`} aria-hidden="true">
      <img src={WALLY_FACE} alt="" />
    </span>
  );
}

/* === TELA INICIAL === */
function WallyWelcome({ onAsk }) {
  return (
    <div className="wally-ext__welcome">
      {/* ----- Ilustração e apresentação ----- */}
      <div className="wally-ext__welcome-brand">
        <img src={WALLY_BODY} alt="" className="wally-ext__mascot" />
        <div className="wally-ext__welcome-copy">
          <span className="wally-ext__eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            WS OS / {t('ASSISTENTE')}
          </span>
          <h3>{t('Como posso ajudar você?')}</h3>
          <p>
            {t('Explore projetos, conheça o desenvolvedor e descubra as funcionalidades do WS OS.')}
          </p>
        </div>
      </div>

      {/* ----- Atalhos de conversa ----- */}
      <div className="wally-ext__suggestion-grid">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            className="wally-ext__suggestion"
            onClick={() => onAsk(t(suggestion.question))}
          >
            <MessageSquare size={17} aria-hidden="true" />
            <span>{t(suggestion.label)}</span>
            <ArrowUp size={14} className="wally-ext__suggestion-arrow" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* === HISTÓRICO DE CONVERSA === */
function WallyMessages({ messages, onOpenApp, onTheme }) {
  return (
    <div className="wally-ext__messages">
      {messages.map((message) => {
        const isUser = message.role === 'user';
        return (
          <article
            key={message.id}
            className={`wally-ext__message ${isUser ? 'wally-ext__message--user' : 'wally-ext__message--assistant'}`}
          >
            {/* ----- Identificação e conteúdo ----- */}
            {!isUser && <WallyAvatar />}
            <div className="wally-ext__message-content">
              <span className="wally-ext__message-author">{isUser ? t('Você') : 'Wally'}</span>
              <div className="wally-ext__bubble">
                <p>{isUser ? message.text : t(message.text)}</p>
                {message.cancelled && (
                  <span className="wally-ext__cancelled">{t('Resposta cancelada')}</span>
                )}
                {!isUser &&
                  message.provider === 'local' &&
                  message.actions
                    ?.filter(
                      (action) =>
                        action.type === 'set-theme' && ['dark', 'light'].includes(action.theme),
                    )
                    .map((action) => (
                      <button
                        key={action.theme}
                        type="button"
                        className="wally-ext__app-link"
                        onClick={() => onTheme(action.theme)}
                      >
                        {t(action.theme === 'light' ? 'Ativar tema claro' : 'Ativar tema escuro')}
                      </button>
                    ))}
                {!isUser &&
                  message.actions
                    ?.filter(
                      (action) =>
                        action.type === 'open-app' && getAppDefinition(action.appId)?.public,
                    )
                    .map((action) => {
                      const app = getAppDefinition(action.appId);
                      return (
                        <button
                          key={action.appId}
                          type="button"
                          className="wally-ext__app-link"
                          onClick={() => onOpenApp(action.appId)}
                        >
                          <ExternalLink size={14} aria-hidden="true" />
                          {t(app.name)}
                        </button>
                      );
                    })}
              </div>
              {!isUser && message.provider && (
                <span className="wally-ext__message-provider">
                  {message.provider === 'gemini' ? 'Gemini' : t('Resposta local')}
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* === APLICATIVO WALLY ESTENDIDO === */
export default function WallyExtended({ instance }) {
  useLocale();
  const { run } = useSystem();
  const [question, setQuestion] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');
  const [composerExpanded, setComposerExpanded] = useState(false);
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

  /* ----- Acompanhar novas respostas ----- */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, status]);

  /* ----- Aplicar somente o tema oferecido por uma resposta local ----- */
  async function applyTheme(theme) {
    if (!['dark', 'light'].includes(theme)) return;
    const result = await executeSystemAction(
      { id: 'appearance.set-theme', params: { theme } },
      { run, context: 'wally', origin: 'wally-extended', originInstanceId: instance?.id },
    );
    setActionFeedback(
      !result.ok
        ? 'Não foi possível alterar o tema.'
        : result.result?.persisted === false
          ? 'Tema aplicado somente nesta sessão.'
          : 'Tema aplicado.',
    );
  }

  /* ----- Enviar uma pergunta ----- */
  async function submitQuestion(value) {
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
    }
  }

  /* ----- Controlar envio por teclado ----- */
  function handleKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent?.isComposing) return;
    event.preventDefault();
    void submitQuestion(question);
  }

  /* ----- Limpar conversa compartilhada ----- */
  function handleClear() {
    clearConversation();
    setQuestion('');
    inputRef.current?.focus();
  }

  /* ----- Executar ação autorizada ----- */
  function openRelatedApp(appId) {
    const app = getAppDefinition(appId);
    if (!app?.public) return;
    void executeSystemAction(
      { id: 'app.open', params: { appId } },
      { run, context: 'wally', origin: 'wally-extended', originInstanceId: instance?.id },
    );
  }

  /* === INTERFACE DO APLICATIVO === */
  return (
    <article className="desktop-window__content ws-wally-extended">
      {/* ----- Cabeçalho do aplicativo ----- */}
      <header className="wally-ext__header">
        <div className="wally-ext__brand">
          <WallyAvatar className="wally-ext__avatar--header" />
          <div className="wally-ext__brand-info">
            <h2>Wally</h2>
            <p>{t('Seu assistente dentro do WS OS')}</p>
          </div>
        </div>
        <div className="wally-ext__header-actions">
          <span className="wally-ext__mode">
            <span className="wally-ext__status-dot" />
            {provider === 'gemini' ? 'Gemini' : t('Local')}
          </span>
          <button
            type="button"
            className="wally-ext__icon-button"
            disabled={messages.length === 0 && !isResponding}
            aria-label={t('Limpar conversa')}
            title={t('Limpar conversa')}
            onClick={handleClear}
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ----- Conteúdo principal e histórico ----- */}
      <main
        ref={scrollRef}
        className="wally-ext__conversation"
        role="log"
        aria-label={t('Conversa com Wally')}
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && !isResponding && (
          <WallyWelcome onAsk={(value) => void submitQuestion(value)} />
        )}
        {messages.length > 0 && (
          <WallyMessages messages={messages} onOpenApp={openRelatedApp} onTheme={applyTheme} />
        )}
        {isResponding && (
          <div className="wally-ext__thinking" role="status">
            <WallyAvatar />
            <div className="wally-ext__thinking-content">
              <LoaderCircle size={16} className="wally-ext__spinner" aria-hidden="true" />
              <span>{t('Wally está preparando uma resposta...')}</span>
              <button type="button" onClick={cancelResponse}>
                <Square size={12} aria-hidden="true" />
                {t('Cancelar')}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ----- Redação e envio de mensagens ----- */}
      <div className="wally-ext__bottom">
        {actionFeedback && <p role="status">{t(actionFeedback)}</p>}
        {status === 'error' && (
          <p className="wally-ext__notice" role="alert">
            {t('Não foi possível gerar uma resposta.')}
          </p>
        )}
        {lastError && (
          <p className="wally-ext__notice" role="status">
            {t(getWallyErrorMessage(lastError))}
          </p>
        )}
        {remoteEnabled && (
          <div className="wally-ext__turnstile">
            <WallyTurnstile key={verificationKey} onTokenChange={setTurnstileToken} />
          </div>
        )}
        <form
          className="wally-ext__composer"
          onSubmit={(event) => {
            event.preventDefault();
            void submitQuestion(question);
          }}
        >
          <textarea
            ref={inputRef}
            value={question}
            maxLength={maxQuestionLength}
            rows={composerExpanded ? 6 : 2}
            aria-label={t('Pergunte ao Wally')}
            placeholder={t('Pergunte qualquer coisa ao Wally...')}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="wally-ext__composer-toolbar">
            {/* ----- Expandir ou recolher campo de escrita ----- */}
            <button
              type="button"
              className="wally-ext__expand-button"
              aria-label={t(
                composerExpanded ? 'Recolher campo de texto' : 'Expandir campo de texto',
              )}
              aria-pressed={composerExpanded}
              onClick={() => setComposerExpanded((current) => !current)}
            >
              {composerExpanded ? (
                <Minimize2 size={16} aria-hidden="true" />
              ) : (
                <Maximize2 size={16} aria-hidden="true" />
              )}
            </button>
            <span className="wally-ext__character-count">
              {question.length}/{maxQuestionLength}
            </span>
            <span className="wally-ext__composer-hint">Enter {t('para enviar')}</span>
            <button
              type="submit"
              className="wally-ext__send-button"
              disabled={!question.trim() || isResponding}
              aria-label={t('Enviar mensagem')}
            >
              <ArrowUp size={18} aria-hidden="true" />
            </button>
          </div>
        </form>
        <footer className="wally-ext__footer">
          <span>
            <ShieldCheck size={13} aria-hidden="true" />
            {remoteEnabled ? t('Verificação de segurança ativa') : t('Modo local')}
          </span>
          <span>
            <CheckCircle2 size={13} aria-hidden="true" />
            WS OS
          </span>
        </footer>
      </div>
    </article>
  );
}


import { useState } from 'react';

import {
  translate as t,
  useLocale,
} from '../../shared/i18n/i18n';

import { getAppDefinition } from '../../core/appRegistry';
import { useSystem } from '../../core/useSystem';
import { openApp } from '../../core/appManager';

import useWallyConversation from '../../features/wally/useWallyConversation';

import '../../styles/apps.css';

export default function WallyExtended() {
  useLocale();

  const { run } = useSystem();
  const [question, setQuestion] = useState('');

  const {
    messages,
    status,
    sendMessage,
    clearConversation,
    provider,
    maxQuestionLength,
  } = useWallyConversation();

  function send(event) {
    event.preventDefault();

    if (sendMessage(question)) {
      setQuestion('');
    }
  }

  function openRelatedApp(appId) {
    const app = getAppDefinition(appId);

    if (!app?.public) return;

    run(openApp, appId, {
      origin: 'wally-extended',
    });
  }

  return (
    <article className="desktop-window__content ws-app">
      <h2>{t('Wally Estendido')}</h2>

      <p>
        {t(
          'Assistente local do portfólio. Sem IA remota ou histórico enviado a servidores.',
        )}
      </p>

      <p>
        <strong>{t('Modo atual')}:</strong>{' '}
        {provider === 'local'
          ? t('Local')
          : provider}
      </p>

      <div
        role="log"
        aria-label={t('Conversa com Wally')}
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && (
          <p>{t('Faça uma pergunta para começar.')}</p>
        )}

        {messages.map((message) => (
          <section
            className="ws-app__card"
            key={message.id}
          >
            <p>
              <strong>
                {message.role === 'user'
                  ? t('Você')
                  : 'Wally'}
                :
              </strong>{' '}
              {message.role === 'user'
                ? message.text
                : t(message.text)}
            </p>

            {message.role === 'assistant' &&
              message.actions
                ?.filter(
                  (action) =>
                    action.type === 'open-app' &&
                    getAppDefinition(action.appId)?.public,
                )
                .map((action) => (
                  <div
                    className="ws-app__toolbar"
                    key={action.appId}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openRelatedApp(action.appId)
                      }
                    >
                      {t(
                        getAppDefinition(action.appId).name,
                      )}
                    </button>
                  </div>
                ))}
          </section>
        ))}
      </div>

      {status === 'error' && (
        <p role="alert">
          {t('Não foi possível gerar uma resposta.')}
        </p>
      )}

      <form onSubmit={send}>
        <label>
          {t('Pergunte ao Wally')}

          <textarea
            value={question}
            maxLength={maxQuestionLength}
            rows={3}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
          />
        </label>

        <div className="ws-app__toolbar">
          <button
            type="submit"
            disabled={!question.trim()}
          >
            {t('Enviar')}
          </button>

          <button
            type="button"
            disabled={messages.length === 0}
            onClick={clearConversation}
          >
            {t('Limpar conversa')}
          </button>
        </div>
      </form>
    </article>
  );
}

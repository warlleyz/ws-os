import { useState } from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { portfolio, contentText } from '../../content/portfolioContent';
import { localWallyAnswer } from '../../services/wallyService';
import { getAppDefinition } from '../../core/appRegistry';
import { useSystem } from '../../core/useSystem';
import { openApp } from '../../core/appManager';
import '../../styles/apps.css';
export default function WallyExtended() {
  const locale = useLocale(),
    { run } = useSystem();
  const [question, setQuestion] = useState(''),
    [messages, setMessages] = useState([]);
  function send(event) {
    event.preventDefault();
    if (!question.trim()) return;
    const answer = localWallyAnswer(question, contentText(portfolio.profile.summary, locale));
    setMessages((current) => [...current, { question, ...answer }].slice(-30));
    setQuestion('');
  }
  return (
    <article className="desktop-window__content ws-app">
      <h2>{t('Wally Estendido')}</h2>
      <p>{t('Assistente local do portfólio. Sem IA remota ou histórico enviado a servidores.')}</p>
      <div role="log" aria-live="polite">
        {messages.map((entry, index) => (
          <section className="ws-app__card" key={index}>
            <p>
              <strong>{t('Você')}:</strong> {entry.question}
            </p>
            <p>
              <strong>Wally:</strong> {t(entry.message)}
            </p>
            <div className="ws-app__toolbar">
              {entry.actions
                .filter(
                  (action) => action.type === 'open-app' && getAppDefinition(action.appId)?.public,
                )
                .map((action) => (
                  <button
                    key={action.appId}
                    type="button"
                    onClick={() => run(openApp, action.appId, { origin: 'wally-extended' })}
                  >
                    {t(getAppDefinition(action.appId).name)}
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>
      <form onSubmit={send}>
        <label>
          {t('Pergunte ao Wally')}
          <textarea
            value={question}
            maxLength={1000}
            rows={3}
            onChange={(event) => setQuestion(event.target.value)}
          />
        </label>
        <div className="ws-app__toolbar">
          <button type="submit" disabled={!question.trim()}>
            {t('Enviar')}
          </button>
          <button type="button" onClick={() => setMessages([])}>
            {t('Limpar conversa')}
          </button>
        </div>
      </form>
    </article>
  );
}

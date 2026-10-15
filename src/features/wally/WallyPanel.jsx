import { useState } from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { localWallyAnswer } from '../../services/wallyService';
import { portfolio, contentText } from '../../content/portfolioContent';
import { useSystem } from '../../core/useSystem';
import { openApp } from '../../core/appManager';
export default function WallyPanel({ setWallyOpen }) {
  const locale = useLocale(),
    { run } = useSystem();
  const [question, setQuestion] = useState(''),
    [answer, setAnswer] = useState(null);
  function open(appId) {
    run(openApp, appId, { origin: 'system' });
    setWallyOpen(false);
  }
  return (
    <section className="taskbar-wally" role="region" aria-label="Wally">
      <header className="taskbar-wally__header">
        <div>
          <strong>Wally</strong>
          <small>{t('Assistente local')}</small>
        </div>
        <button type="button" aria-label={t('Fechar Wally')} onClick={() => setWallyOpen(false)}>
          ×
        </button>
      </header>
      <div className="taskbar-wally__content">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setAnswer(localWallyAnswer(question, contentText(portfolio.profile.summary, locale)));
          }}
        >
          <label>
            {t('Pergunte ao Wally')}
            <input
              value={question}
              maxLength={1000}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </label>
          <button type="submit" disabled={!question.trim()}>
            {t('Enviar')}
          </button>
        </form>
        {answer && (
          <div role="status">
            <p>{t(answer.message)}</p>
            {answer.actions.map((action) => (
              <button key={action.appId} type="button" onClick={() => open(action.appId)}>
                {t('Abrir aplicativo')}
              </button>
            ))}
          </div>
        )}
        <button type="button" onClick={() => open('wally-extended')}>
          {t('Abrir Wally Estendido')}
        </button>
      </div>
    </section>
  );
}

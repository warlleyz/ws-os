import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { SystemIcon } from '../../shared/components/SystemIcon';

export default function WallyPanel({ setWallyOpen }) {
  useLocale();
  return (
    <section className="taskbar-wally" role="region" aria-label="Wally">
      <header className="taskbar-wally__header">
        <div>
          <strong>Wally</strong>
          <small>{t('Assistente da WS OS')}</small>
        </div>

        <button type="button" aria-label={t('Fechar Wally')} onClick={() => setWallyOpen(false)}>
          ×
        </button>
      </header>

      <div className="taskbar-wally__content">
        <SystemIcon name="wally" size={32} />

        <strong>{t('Olá! Eu sou o Wally.')}</strong>

        <p>
          {t(
            'Sou o assistente da WS OS. Minhas funcionalidades serão integradas nas próximas etapas.',
          )}
        </p>
      </div>
    </section>
  );
}

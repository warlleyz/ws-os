import { translate as t, useLocale } from '../../shared/i18n/i18n';
import './BootScreen.css';

export default function BootScreen() {
  useLocale();
  return (
    <main className="ws-boot" aria-label={t('Inicializando WS OS')}>
      <div className="ws-boot__content" role="status">
        <strong>WS OS</strong>
        <p>{t('Inicializando sistema...')}</p>

        <div className="ws-boot__progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </main>
  );
}

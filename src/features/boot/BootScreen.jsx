
import { Cpu } from 'lucide-react';
import {
  translate as t,
  useLocale,
} from '../../shared/i18n/i18n';

import './BootScreen.css';

export default function BootScreen() {
  useLocale();

  return (
    <main
      className="ws-boot"
      aria-label={t('Inicializando WS OS')}
    >
      <div className="ws-boot__ambient" aria-hidden="true" />
      <div className="ws-boot__grid" aria-hidden="true" />

      <div className="ws-boot__content" role="status">
        <div className="ws-boot__symbol" aria-hidden="true">
          <div className="ws-boot__symbol-ring">
            <div className="ws-boot__symbol-core">
              <Cpu size={29} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="ws-boot__identity">
          <h1 className="ws-boot__title">WS OS</h1>
          <span className="ws-boot__subtitle">
            PERSONAL OPERATING SYSTEM
          </span>
        </div>

        <div className="ws-boot__loading">
          <p>{t('Inicializando sistema...')}</p>

          <div
            className="ws-boot__progress"
            aria-hidden="true"
          >
            <span />
          </div>

          <div
            className="ws-boot__loading-dots"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <footer className="ws-boot__footer">
        <span>WS OS v2</span>
        <span>INITIALIZATION</span>
      </footer>
    </main>
  );
}

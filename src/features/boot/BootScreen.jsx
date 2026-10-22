import { Cpu } from 'lucide-react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';

import './BootScreen.css';

/* === Configuração da inicialização === */
/* ----- Frases apresentadas durante o boot ----- */
const BOOT_MESSAGES = [
  'Inicializando sistema...',
  'Carregando...',
  'Bem-vindo à WS OS',
];

/* === Tela de inicialização === */
export default function BootScreen() {
  useLocale();

  /* === Renderização === */
  return (
    <main
      className="ws-boot"
      aria-label={t('Inicializando WS OS')}
    >
      {/* === Ambiente visual === */}
      <div className="ws-boot__ambient" aria-hidden="true" />
      <div className="ws-boot__grid" aria-hidden="true" />

      {/* === Conteúdo central === */}
      <div className="ws-boot__content">
        {/* ----- Símbolo de inicialização ----- */}
        <div className="ws-boot__symbol" aria-hidden="true">
          <div className="ws-boot__symbol-frame">
            <Cpu size={30} strokeWidth={1.6} />
          </div>
        </div>

        {/* ----- Identidade WS OS ----- */}
        <h1 className="ws-boot__title">
          WS <span>OS</span>
        </h1>

        {/* === Área de carregamento === */}
        <div className="ws-boot__loading">
          {/* ----- Mensagens sequenciais ----- */}
          <div className="ws-boot__messages" aria-hidden="true">
            {BOOT_MESSAGES.map((message, index) => (
              <span
                key={message}
                className={`ws-boot__message ws-boot__message--${index + 1}`}
              >
                {t(message)}
              </span>
            ))}
          </div>

          {/* ----- Anúncio acessível ----- */}
          <span className="ws-boot__sr-only" role="status">
            {t('Inicializando sistema...')}
          </span>

          {/* ----- Barra de progresso ----- */}
          <div className="ws-boot__progress" aria-hidden="true">
            <span className="ws-boot__progress-fill" />
          </div>
        </div>
      </div>

      {/* === Rodapé === */}
      <footer className="ws-boot__footer">
        <span>WS OS v2</span>
      </footer>
    </main>
  );
}

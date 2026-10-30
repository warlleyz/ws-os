import {
  BellOff,
  BellRing,
  Check,
  ExternalLink,
  Gauge,
  Languages,
  Moon,
  PanelBottom,
  Settings2,
  SlidersHorizontal,
  Sun,
  Waves,
  X,
} from 'lucide-react';
import { translate as t, useLocale, setLocale } from '../../shared/i18n/i18n';
import { useAccessibility, setAccessibility } from '../../core/effectsManager';
import { setTheme } from '../../core/themeManager';
import {
  useNotificationPreferences,
  setDoNotDisturb,
} from '../../core/notificationPreferences';
import { useSystem } from '../../core/useSystem';
import { openApp } from '../../core/appManager';
import Tooltip from '../../shared/components/Tooltip';
import './QuickControls.css';

/* === CONTROLES DE ACESSO RÁPIDO === */
/* ----- Botão de preferência ----- */
function ControlTile({ icon: Icon, label, description, active, onClick }) {
  return (
    <Tooltip content={`${label} — ${t(active ? 'Ativado' : 'Desativado')}`} delay={450}>
      <button
        type="button"
        className={`ws-control-tile${active ? ' ws-control-tile--active' : ''}`}
        aria-pressed={active}
        onClick={onClick}
      >
        <span className="ws-control-tile__top">
          <span className="ws-control-tile__icon">
            <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
          </span>
          {active && <Check size={15} className="ws-control-tile__check" aria-hidden="true" />}
        </span>
        <span className="ws-control-tile__text">
          <strong>{label}</strong>
          <small>{description}</small>
        </span>
      </button>
    </Tooltip>
  );
}

/* === CENTRAL DE CONTROLE === */
export default function QuickControls({
  setQuickControlsOpen,
  theme,
  autoHideTaskbar,
  onAutoHideTaskbarChange,
  showAutoHideTaskbar = true,
}) {
  const locale = useLocale();
  const accessibility = useAccessibility();
  const { doNotDisturb } = useNotificationPreferences();
  const { notify, run } = useSystem();
  const isDark = theme === 'dark';

  /* ----- Informar falhas de persistência ----- */
  function report(saved) {
    if (saved === false) {
      notify({
        title: 'Preferência não salva',
        message: 'A alteração permanece ativa nesta sessão, mas poderá ser perdida ao recarregar.',
        type: 'warning',
        source: 'Sistema',
      });
    }
  }

  /* ----- Alterar preferências de acessibilidade ----- */
  function changeEffect(key, enabled) {
    report(setAccessibility({
      ...accessibility,
      [key]: enabled,
    }));
  }

  /* ----- Abrir o aplicativo Configurações ----- */
  function openSettings() {
    const opened = run(openApp, 'settings');
    if (opened) setQuickControlsOpen(false);
  }

  /* === RENDERIZAÇÃO DO PAINEL === */
  return (
    <section
      className="taskbar-quick-controls ws-controls"
      role="region"
      aria-label={t('Painel de Controle Rápido')}
    >
      {/* ----- Cabeçalho ----- */}
      <header className="ws-controls__header">
        <span className="ws-controls__heading-icon">
          <SlidersHorizontal size={19} aria-hidden="true" />
        </span>
        <div className="ws-controls__heading">
          <strong>{t('Central de Controle')}</strong>
          <small>{t('Preferências rápidas do sistema')}</small>
        </div>
        <Tooltip content={t('Fechar Controle Rápido')}>
          <button
            type="button"
            className="ws-controls__icon-button"
            aria-label={t('Fechar Controle Rápido')}
            onClick={() => setQuickControlsOpen(false)}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </Tooltip>
      </header>

      {/* ----- Preferências rápidas ----- */}
      <div className="ws-controls__content">
        <div className="ws-controls__section-header">
          <strong>{t('Ações rápidas')}</strong>
        </div>
        <div className="ws-controls__tiles">
          <ControlTile
            icon={isDark ? Moon : Sun}
            label={t(isDark ? 'Tema escuro' : 'Tema claro')}
            description={t('Aparência')}
            active={isDark}
            onClick={() => report(setTheme(isDark ? 'light' : 'dark'))}
          />
          <ControlTile
            icon={doNotDisturb ? BellOff : BellRing}
            label={t('Não Perturbe')}
            description={t(doNotDisturb ? 'Ativado' : 'Desativado')}
            active={doNotDisturb}
            onClick={() => report(setDoNotDisturb(!doNotDisturb))}
          />
          <ControlTile
            icon={Gauge}
            label={t('Baixo custo')}
            description={t('Reduzir efeitos')}
            active={Boolean(accessibility.lowEffects)}
            onClick={() => changeEffect('lowEffects', !accessibility.lowEffects)}
          />
          {showAutoHideTaskbar ? (
            <ControlTile
              icon={PanelBottom}
              label={t('Ocultar Taskbar')}
              description={t(autoHideTaskbar ? 'Ativado' : 'Desativado')}
              active={Boolean(autoHideTaskbar)}
              onClick={() => onAutoHideTaskbarChange(!autoHideTaskbar)}
            />
          ) : (
            <ControlTile
              icon={Waves}
              label={t('Reduzir movimento')}
              description={t('Acessibilidade')}
              active={Boolean(accessibility.motion)}
              onClick={() => changeEffect('motion', !accessibility.motion)}
            />
          )}
        </div>

        {/* ----- Idioma do sistema ----- */}
        <div className="ws-controls__section-header">
          <strong>{t('Sistema')}</strong>
        </div>
        <label className="ws-controls__locale">
          <span className="ws-controls__locale-icon">
            <Languages size={17} aria-hidden="true" />
          </span>
          <span className="ws-controls__locale-label">
            <strong>{t('Idioma')}</strong>
          </span>
          <select
            value={locale}
            aria-label={t('Idioma')}
            onChange={(event) => report(setLocale(event.target.value))}
          >
            <option value="pt-BR">Português</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>

      {/* ----- Acesso às configurações avançadas ----- */}
      <footer className="ws-controls__footer">
        <span>{t('Configurações')}</span>
        <Tooltip content={t('Abrir Configurações')}>
          <button
            type="button"
            onClick={openSettings}
            aria-label={t('Abrir Configurações')}
          >
            <Settings2 size={15} aria-hidden="true" />
            {t('Configurações')}
            <ExternalLink size={13} aria-hidden="true" />
          </button>
        </Tooltip>
      </footer>
    </section>
  );
}

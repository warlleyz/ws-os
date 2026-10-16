import {
  BellOff,
  BellRing,
  Check,
  ChevronDown,
  ChevronUp,
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

import { useState } from 'react';
import { translate as t, useLocale, setLocale } from '../../shared/i18n/i18n';
import { useAccessibility, setAccessibility } from '../../core/effectsManager';
import { setTheme } from '../../core/themeManager';
import { useNotificationPreferences, setDoNotDisturb } from '../../core/notificationPreferences';
import { useSystem } from '../../core/useSystem';
import { openApp } from '../../core/appManager';
import Tooltip from '../../shared/components/Tooltip';

import './QuickControls.css';

function ControlTile({ icon: Icon, label, description, active, onClick, disabled = false }) {
  return (
    <Tooltip content={`${label} — ${t(active ? 'Ativado' : 'Desativado')}`} delay={450}>
      <button
        type="button"
        className={`ws-control-tile${active ? ' ws-control-tile--active' : ''}`}
        aria-pressed={active}
        disabled={disabled}
        onClick={onClick}
      >
        <span className="ws-control-tile__icon">
          <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        </span>

        <span className="ws-control-tile__text">
          <strong>{label}</strong>
          <small>{description}</small>
        </span>
      </button>
    </Tooltip>
  );
}

function EffectToggle({ label, description, checked, onChange }) {
  return (
    <label className="ws-controls__effect">
      <span>
        <strong>{t(label)}</strong>
        <small>{t(description)}</small>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

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

  const [detailsOpen, setDetailsOpen] = useState(false);

  const isDark = theme === 'dark';

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

  function changeEffect(key, enabled) {
    report(
      setAccessibility({
        ...accessibility,
        [key]: enabled,
      }),
    );
  }

  function openSettings() {
    const opened = run(openApp, 'settings');

    if (opened) {
      setQuickControlsOpen(false);
    }
  }

  return (
    <section
      className="taskbar-quick-controls ws-controls"
      role="region"
      aria-label={t('Painel de Controle Rápido')}
    >
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

      <div className="ws-controls__content">
        <div className="ws-controls__section-header">
          <strong>{t('Ações rápidas')}</strong>
          <span>{t('Personalize sua experiência')}</span>
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

        <div className="ws-controls__section-header ws-controls__section-header--compact">
          <strong>{t('Sistema')}</strong>
        </div>

        <label className="ws-controls__locale">
          <span className="ws-controls__locale-icon">
            <Languages size={17} aria-hidden="true" />
          </span>

          <span className="ws-controls__locale-label">
            <strong>{t('Idioma')}</strong>
            <small>{t('Idioma do sistema')}</small>
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

        <div className="ws-controls__advanced">
          <button
            type="button"
            className="ws-controls__advanced-trigger"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((current) => !current)}
          >
            <span className="ws-controls__advanced-heading">
              <Settings2 size={16} aria-hidden="true" />
              {t('Acessibilidade e desempenho')}
            </span>

            {detailsOpen ? (
              <ChevronUp size={16} aria-hidden="true" />
            ) : (
              <ChevronDown size={16} aria-hidden="true" />
            )}
          </button>

          {detailsOpen && (
            <div className="ws-controls__advanced-body">
              <EffectToggle
                label="Reduzir movimento"
                description="Minimizar animações"
                checked={Boolean(accessibility.motion)}
                onChange={(enabled) => changeEffect('motion', enabled)}
              />

              <EffectToggle
                label="Reduzir transparência"
                description="Aumentar a opacidade dos painéis"
                checked={Boolean(accessibility.transparency)}
                onChange={(enabled) => changeEffect('transparency', enabled)}
              />

              <EffectToggle
                label="Modo de baixo custo"
                description="Reduzir efeitos visuais"
                checked={Boolean(accessibility.lowEffects)}
                onChange={(enabled) => changeEffect('lowEffects', enabled)}
              />
            </div>
          )}
        </div>
      </div>

      <footer className="ws-controls__footer">
        <span>
          <Check size={13} aria-hidden="true" />
          {t('Preferências do WS OS')}
        </span>

        <Tooltip content={t('Abrir Configurações')}>
          <button type="button" onClick={openSettings} aria-label={t('Abrir Configurações')}>
            <Settings2 size={15} aria-hidden="true" />
            {t('Configurações')}
            <ExternalLink size={13} aria-hidden="true" />
          </button>
        </Tooltip>
      </footer>
    </section>
  );
}

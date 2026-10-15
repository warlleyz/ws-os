import { translate as t, useLocale, setLocale } from '../../shared/i18n/i18n';
import { useAccessibility, setAccessibility } from '../../core/effectsManager';
import { setTheme } from '../../core/themeManager';
import { useSystem } from '../../core/useSystem';

export default function QuickControls({
  setQuickControlsOpen,
  theme,
  autoHideTaskbar,
  onAutoHideTaskbarChange,
  showAutoHideTaskbar = true,
}) {
  const locale = useLocale();
  const accessibility = useAccessibility();
  const { notify } = useSystem();
  function report(saved) {
    if (!saved)
      notify({
        title: 'Preferência não salva',
        message: 'Não foi possível salvar esta preferência. Ela continua ativa nesta sessão.',
        type: 'warning',
        source: 'Sistema',
      });
  }
  return (
    <section
      className="taskbar-quick-controls"
      role="region"
      aria-label={t('Painel de Controle Rápido')}
    >
      <header className="taskbar-quick-controls__header">
        <div>
          <strong>{t('Controle Rápido')}</strong>
          <small>{t('Preferências do sistema')}</small>
        </div>
        <button
          type="button"
          aria-label={t('Fechar Controle Rápido')}
          onClick={() => setQuickControlsOpen(false)}
        >
          ×
        </button>
      </header>
      <div className="taskbar-quick-controls__content">
        <div className="taskbar-quick-controls__section">
          <strong>{t('Aparência')}</strong>
          <label className="taskbar-quick-controls__theme">
            <span>{t('Tema do sistema')}</span>
            <select
              aria-label={t('Tema do sistema')}
              value={theme}
              onChange={(event) => {
                report(setTheme(event.target.value));
              }}
            >
              <option value="dark">{t('Escuro')}</option>
              <option value="light">{t('Claro')}</option>
            </select>
          </label>
          <label className="taskbar-quick-controls__theme">
            <span>{t('Idioma')}</span>
            <select
              aria-label={t('Idioma')}
              value={locale}
              onChange={(event) => report(setLocale(event.target.value))}
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en">English</option>
            </select>
          </label>
          {showAutoHideTaskbar && (
            <label className="ws-effect-option">
              <input
                type="checkbox"
                checked={autoHideTaskbar}
                onChange={(event) => onAutoHideTaskbarChange(event.target.checked)}
              />
              {t('Ocultar automaticamente a barra de tarefas')}
            </label>
          )}
        </div>
        <fieldset className="taskbar-quick-controls__section">
          <legend>{t('Efeitos')}</legend>
          {[
            ['motion', 'Reduzir movimento'],
            ['transparency', 'Reduzir transparência'],
            ['lowEffects', 'Modo de baixo custo'],
          ].map(([key, label]) => (
            <label key={key} className="ws-effect-option">
              <input
                type="checkbox"
                checked={accessibility[key]}
                onChange={(event) =>
                  report(setAccessibility({ ...accessibility, [key]: event.target.checked }))
                }
              />
              {t(label)}
            </label>
          ))}
          <p>{t('As preferências de acessibilidade também respeitam as opções do sistema.')}</p>
        </fieldset>
      </div>
    </section>
  );
}

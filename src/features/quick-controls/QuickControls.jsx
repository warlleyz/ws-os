export default function QuickControls({ setQuickControlsOpen, theme, onThemeChange }) {
  return (
    <section
      className="taskbar-quick-controls"
      role="region"
      aria-label="Painel de Controle Rápido"
    >
      <header className="taskbar-quick-controls__header">
        <div>
          <strong>Controle Rápido</strong>
          <small>Preferências do sistema</small>
        </div>

        <button
          type="button"
          aria-label="Fechar Controle Rápido"
          onClick={() => setQuickControlsOpen(false)}
        >
          ×
        </button>
      </header>

      <div className="taskbar-quick-controls__content">
        <div className="taskbar-quick-controls__section">
          <strong>Aparência</strong>

          <label className="taskbar-quick-controls__theme">
            <span>Tema do sistema</span>

            <select
              aria-label="Tema do sistema"
              value={theme}
              onChange={(event) => onThemeChange(event.target.value)}
            >
              <option value="dark">Escuro</option>
              <option value="light">Claro</option>
            </select>
          </label>
        </div>

        <div className="taskbar-quick-controls__section">
          <strong>Efeitos</strong>
          <p>Animações e transparências.</p>
        </div>
      </div>
    </section>
  );
}

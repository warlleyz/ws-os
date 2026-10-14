import { SystemIcon } from '../../shared/components/SystemIcon';

export default function WallyPanel({ setWallyOpen }) {
  return (
    <section className="taskbar-wally" role="region" aria-label="Wally">
      <header className="taskbar-wally__header">
        <div>
          <strong>Wally</strong>
          <small>Assistente da WS OS</small>
        </div>

        <button type="button" aria-label="Fechar Wally" onClick={() => setWallyOpen(false)}>
          ×
        </button>
      </header>

      <div className="taskbar-wally__content">
        <SystemIcon name="wally" size={32} />

        <strong>Olá! Eu sou o Wally.</strong>

        <p>
          Sou o assistente da WS OS. Minhas funcionalidades serão integradas nas próximas etapas.
        </p>
      </div>
    </section>
  );
}

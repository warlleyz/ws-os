export default function WelcomeDialog({ onClose }) {
    return (
        <div className="ws-welcome-backdrop">
            <section
                className="ws-welcome"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ws-welcome-title"
            >
                <span className="ws-welcome__label">WS OS</span>

                <h1 id="ws-welcome-title">Bem-vindo à WS OS</h1>

                <p>Olá! Eu sou o Wally, seu assistente.</p>

                <p>
                    Explore os projetos, conheça o desenvolvedor e descubra as
                    funcionalidades deste portfólio.
                </p>

                <button type="button" onClick={onClose} autoFocus>
                    Começar
                </button>
            </section>
        </div>
    );
}
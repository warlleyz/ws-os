
import './App.css';

function App() {
  return (
    <main className="system">
      <div className="system__background" aria-hidden="true" />

      <section className="welcome" aria-labelledby="welcome-title">
        <div className="welcome__identity">
          <span className="welcome__symbol" aria-hidden="true">
            W
          </span>

          <span className="welcome__version">VERSION 2.0</span>
        </div>

        <div className="welcome__content">
          <span className="welcome__eyebrow">
            PORTFÓLIO INTERATIVO
          </span>

          <h1 id="welcome-title">
            WS <span>OS</span>
          </h1>

          <p>
            Uma nova experiência está sendo construída.
          </p>
        </div>

        <div className="welcome__footer">
          <span className="welcome__status">
            <span className="welcome__status-dot" />
            Ambiente de desenvolvimento
          </span>

          <span className="welcome__signature">
            WARLLEY.DEV
          </span>
        </div>
      </section>
    </main>
  );
}

export default App;

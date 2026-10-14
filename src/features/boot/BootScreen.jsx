export default function BootScreen() {
    return (
        <main className="ws-boot" aria-label="Inicializando WS OS">
            <div className="ws-boot__content" role="status">
                <strong>WS OS</strong>
                <p>Inicializando sistema...</p>

                <div className="ws-boot__progress" aria-hidden="true">
                    <span />
                </div>
            </div>
        </main>
    );
}
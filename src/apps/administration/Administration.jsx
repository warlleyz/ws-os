
import { useEffect, useState } from 'react';
import {
    verifyAdminSession,
    getAdminSessionExpiresAt,
} from '../../services/authService';
import '../../styles/apps.css';
import './Administration.css';
import AdminPosts from './AdminPosts';

const ADMIN_SECTIONS = [
    { id: 'overview', title: 'Visão geral', description: 'Resumo do ambiente administrativo.' },
    { id: 'posts', title: 'Publicações', description: 'Gerenciamento de notas e artigos.' },
    { id: 'files', title: 'Arquivos', description: 'Gerenciamento dos arquivos oficiais.' },
    { id: 'events', title: 'Eventos', description: 'Eventos públicos e calendário.' },
    { id: 'requests', title: 'Solicitações', description: 'Solicitações privadas e agendamentos.' },
    { id: 'system', title: 'Sistema', description: 'Informações e ferramentas administrativas.' },
];

export default function Administration() {
    const [status, setStatus] = useState('checking');

    const [activeSection, setActiveSection] = useState('overview');

    const currentSection =
        ADMIN_SECTIONS.find((section) => section.id === activeSection)
        ?? ADMIN_SECTIONS[0];

    useEffect(() => {
        let active = true;
        let expirationTimer;

        async function checkAccess() {
            if (!active) return;

            setStatus('checking');
            clearTimeout(expirationTimer);

            const authorized = await verifyAdminSession();

            if (!active) return;

            if (!authorized) {
                setStatus('denied');
                return;
            }

            const expiresAt = getAdminSessionExpiresAt();

            if (!expiresAt || expiresAt <= Date.now()) {
                setStatus('denied');
                return;
            }

            setStatus('authorized');

            expirationTimer = setTimeout(() => {
                if (active) setStatus('denied');
            }, expiresAt - Date.now());
        }

        function handleVisibilityChange() {
            if (!document.hidden) {
                void checkAccess();
            }
        }

        function handleFocus() {
            void checkAccess();
        }

        void checkAccess();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            active = false;
            clearTimeout(expirationTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);


    if (status === 'checking') {
        return (
            <article className="desktop-window__content ws-app">
                <p>Verificando autorização administrativa...</p>
            </article>
        );
    }

    if (status === 'denied') {
        return (
            <article className="desktop-window__content ws-app">
                <h2>Acesso negado</h2>
                <p>
                    Sua sessão administrativa expirou ou não está autorizada.
                    Realize novamente o login pelo Terminal.
                </p>
            </article>
        );
    }


    return (
        <article className="desktop-window__content ws-app ws-administration">
            <header className="ws-administration__header">
                <div>
                    <h2>Central de Administração</h2>
                    <p>Gerenciamento do WS OS</p>
                </div>
                <span>Administrador autenticado</span>
            </header>

            <div className="ws-administration__layout">
                <nav
                    className="ws-administration__navigation"
                    aria-label="Seções administrativas"
                >
                    {ADMIN_SECTIONS.map((section) => (
                        <button
                            key={section.id}
                            type="button"
                            aria-current={
                                activeSection === section.id
                                    ? 'page'
                                    : undefined
                            }
                            onClick={() => setActiveSection(section.id)}
                        >
                            {section.title}
                        </button>
                    ))}
                </nav>

                <section
                    className="ws-administration__content"
                    aria-labelledby="admin-section-title"
                >
                    <h3 id="admin-section-title">
                        {currentSection.title}
                    </h3>

                    <p>{currentSection.description}</p>

                    {activeSection === 'posts' ? (
                        <AdminPosts />
                    ) : activeSection === 'overview' ? (
                        <div>
                            <h4>Ambiente administrativo</h4>
                            <p>
                                Autenticação e autorização verificadas.
                            </p>
                            <p>
                                Selecione uma seção para acessar os módulos
                                administrativos.
                            </p>
                        </div>
                    ) : (
                        <p>
                            As ferramentas desta seção serão conectadas
                            nas próximas etapas.
                        </p>
                    )}
                </section>
            </div>
        </article>
    );
}

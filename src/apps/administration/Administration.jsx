import { useEffect, useState } from 'react';
import { verifyAdminSession, subscribeAdminSession } from '../../services/authService';
import { canCloseApp } from '../../core/appCloseGuards';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import AdminPosts from './AdminPosts';
import AdminContent from './AdminContent';
import AdminFiles from './AdminFiles';
import AdminRequests from './AdminRequests';
import AdminRankings from './AdminRankings';
import AdminProjects from './AdminProjects';
import '../../styles/apps.css';
import './Administration.css';

const sections = [
  ['overview', 'Visão geral'],
  ['posts', 'Publicações'],
  ['projects', 'Projetos'],
  ['files', 'Arquivos oficiais'],
  ['documents', 'Catálogo de documentos'],
  ['rankings', 'Moderação de rankings'],
  ['events', 'Eventos'],
  ['requests', 'Solicitações'],
  ['system', 'Sistema'],
];
export default function Administration({ instance }) {
  useLocale();
  const [status, setStatus] = useState('checking'),
    [activeSection, setActiveSection] = useState('overview');
  useEffect(() => {
    let active = true,
      request = 0;
    async function check() {
      const current = ++request;
      const allowed = await verifyAdminSession();
      if (active && current === request) setStatus(allowed ? 'authorized' : 'denied');
    }
    const visibility = () => {
      if (!document.hidden) void check();
    };
    const unsubscribe = subscribeAdminSession(() => {
      void check();
    });
    void check();
    window.addEventListener('focus', visibility);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener('focus', visibility);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  const authorized = status === 'authorized';
  function navigate(id) {
    if (id === activeSection) return;
    if (!canCloseApp(instance.id) && !window.confirm(t('Descartar alterações não salvas?'))) return;
    setActiveSection(id);
  }
  return (
    <article className="desktop-window__content ws-app ws-administration">
      <header className="ws-administration__header">
        <div>
          <h2>{t('Central de Administração')}</h2>
          <p>{t('Gerenciamento do WS OS')}</p>
        </div>
        <span>
          {t(
            authorized
              ? 'Administrador autenticado'
              : status === 'checking'
                ? 'Verificando autorização administrativa...'
                : 'Acesso negado',
          )}
        </span>
      </header>
      {!authorized && (
        <p role="status">
          {t(
            status === 'checking'
              ? 'Verificando autorização administrativa...'
              : 'Sua sessão administrativa expirou ou não está autorizada. Realize novamente o login pelo Terminal.',
          )}
        </p>
      )}
      <div className="ws-administration__layout">
        <nav className="ws-administration__navigation" aria-label={t('Seções administrativas')}>
          {sections.map(([id, title]) => (
            <button
              key={id}
              disabled={!authorized}
              aria-current={id === activeSection ? 'page' : undefined}
              onClick={() => navigate(id)}
            >
              {t(title)}
            </button>
          ))}
        </nav>
        <section
          className="ws-administration__content"
          aria-label={t(sections.find(([id]) => id === activeSection)[1])}
        >
          {activeSection === 'projects' ? (
            <AdminProjects instanceId={instance.id} authorized={authorized} />
          ) : activeSection === 'posts' ? (
            <AdminPosts instanceId={instance.id} authorized={authorized} />
          ) : activeSection === 'files' ? (
            <AdminFiles instanceId={instance.id} authorized={authorized} />
          ) : activeSection === 'rankings' ? (
            <AdminRankings instanceId={instance.id} authorized={authorized} />
          ) : ['documents', 'events'].includes(activeSection) ? (
            <AdminContent
              key={activeSection}
              kind={activeSection === 'documents' ? 'files' : 'events'}
              instanceId={instance.id}
              authorized={authorized}
            />
          ) : activeSection === 'requests' ? (
            <AdminRequests instanceId={instance.id} authorized={authorized} />
          ) : activeSection === 'system' ? (
            <>
              <h3>{t('Sistema')}</h3>
              <p>
                {t(
                  'Arquivos pessoais permanecem exclusivamente no navegador do visitante. Administração não fornece acesso remoto a esses dados.',
                )}
              </p>
              <p>
                {t(
                  'Migrações, segredos, publicação e configurações de produção são aplicados fora deste painel.',
                )}
              </p>
            </>
          ) : (
            <>
              <h3>{t('Ambiente administrativo')}</h3>
              <p>
                {t(
                  'Selecione uma seção para gerenciar conteúdo. As permissões são verificadas em cada operação no servidor.',
                )}
              </p>
            </>
          )}
        </section>
      </div>
    </article>
  );
}

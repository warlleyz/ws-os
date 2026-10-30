import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpenText,
  CalendarDays,
  ChartNoAxesCombined,
  FileStack,
  FolderOpen,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Settings2,
} from 'lucide-react';
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

/* === NAVEGAÇÃO ADMINISTRATIVA === */
/* ----- Seções e ícones do sistema ----- */
const sections = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'posts', label: 'Publicações', icon: BookOpenText },
  { id: 'projects', label: 'Projetos', icon: FolderOpen },
  { id: 'files', label: 'Arquivos oficiais', icon: FileStack },
  { id: 'documents', label: 'Catálogo de documentos', icon: FileStack },
  { id: 'rankings', label: 'Moderação de rankings', icon: ChartNoAxesCombined },
  { id: 'events', label: 'Eventos', icon: CalendarDays },
  { id: 'requests', label: 'Solicitações', icon: Mail },
  { id: 'system', label: 'Sistema', icon: Settings2 },
];

/* === APLICATIVO ADMINISTRAÇÃO === */
export default function Administration({ instance }) {
  useLocale();

  /* ----- Sessão e navegação ----- */
  const [status, setStatus] = useState('checking');
  const [activeSection, setActiveSection] = useState('overview');

  /* ----- Verificação de autorização ----- */
  useEffect(() => {
    let active = true;
    let request = 0;

    async function check() {
      const current = ++request;
      setStatus('checking');
      const allowed = await verifyAdminSession();

      if (active && current === request) {
        setStatus(allowed ? 'authorized' : 'denied');
      }
    }

    function handleVisibility() {
      if (!document.hidden) void check();
    }

    const unsubscribe = subscribeAdminSession(() => {
      void check();
    });

    void check();
    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const authorized = status === 'authorized';
  const selected = sections.find((section) => section.id === activeSection) ?? sections[0];
  const SelectedIcon = selected.icon;

  /* ----- Preservar alterações pendentes ao navegar ----- */
  function navigate(id) {
    if (!authorized || id === activeSection) return;

    if (
      !canCloseApp(instance.id) &&
      !window.confirm(t('Descartar alterações não salvas?'))
    ) {
      return;
    }

    setActiveSection(id);
  }

  /* ----- Conteúdo da seção ativa ----- */
  function renderSection() {
    if (activeSection === 'projects') {
      return <AdminProjects instanceId={instance.id} authorized={authorized} />;
    }

    if (activeSection === 'posts') {
      return <AdminPosts instanceId={instance.id} authorized={authorized} />;
    }

    if (activeSection === 'files') {
      return <AdminFiles instanceId={instance.id} authorized={authorized} />;
    }

    if (activeSection === 'rankings') {
      return <AdminRankings instanceId={instance.id} authorized={authorized} />;
    }

    if (activeSection === 'documents' || activeSection === 'events') {
      return (
        <AdminContent
          key={activeSection}
          kind={activeSection === 'documents' ? 'files' : 'events'}
          instanceId={instance.id}
          authorized={authorized}
        />
      );
    }

    if (activeSection === 'requests') {
      return <AdminRequests instanceId={instance.id} authorized={authorized} />;
    }

    if (activeSection === 'system') {
      return (
        <div className="ws-administration__info-card">
          <ShieldCheck size={26} aria-hidden="true" />
          <h3>{t('Sistema')}</h3>
          <p>
            {t('Arquivos pessoais permanecem exclusivamente no navegador do visitante. Administração não fornece acesso remoto a esses dados.')}
          </p>
          <p>
            {t('Migrações, segredos, publicação e configurações de produção são aplicados fora deste painel.')}
          </p>
        </div>
      );
    }

    return (
      <div className="ws-administration__welcome">
        <div className="ws-administration__welcome-icon">
          <LayoutDashboard size={30} strokeWidth={1.7} aria-hidden="true" />
        </div>
        <h3>{t('Ambiente administrativo')}</h3>
        <p>
          {t('Selecione uma seção para gerenciar conteúdo. As permissões são verificadas em cada operação no servidor.')}
        </p>
        <div className="ws-administration__quick-links">
          {sections.slice(1, 5).map((section) => {
            const Icon = section.icon;

            return (
              <button key={section.id} type="button" onClick={() => navigate(section.id)}>
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{t(section.label)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* === RENDERIZAÇÃO === */
  return (
    <article className="desktop-window__content ws-app ws-administration">
      {/* ----- Cabeçalho ----- */}
      <header className="ws-administration__header">
        <div className="ws-administration__brand">
          <span className="ws-administration__brand-icon" aria-hidden="true">
            <LockKeyhole size={21} strokeWidth={1.8} />
          </span>
          <div>
            <h2>{t('Central de Administração')}</h2>
            <p>{t('Gerenciamento do WS OS')}</p>
          </div>
        </div>
        <span className={`ws-administration__status ws-administration__status--${status}`} role="status">
          <span className="ws-administration__status-dot" aria-hidden="true" />
          {t(
            authorized
              ? 'Administrador autenticado'
              : status === 'checking'
                ? 'Verificando autorização administrativa...'
                : 'Acesso negado',
          )}
        </span>
      </header>

      {/* ----- Navegação e conteúdo ----- */}
      <div className="ws-administration__layout">
        <nav className="ws-administration__navigation" aria-label={t('Seções administrativas')}>
          <div className="ws-administration__navigation-label">{t('Central de Administração')}</div>
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                type="button"
                disabled={!authorized}
                aria-current={section.id === activeSection ? 'page' : undefined}
                onClick={() => navigate(section.id)}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{t(section.label)}</span>
              </button>
            );
          })}
        </nav>

        <main className="ws-administration__content" aria-label={t(selected.label)}>
          {authorized ? (
            <>
              <div className="ws-administration__section-heading">
                <span className="ws-administration__section-icon" aria-hidden="true">
                  <SelectedIcon size={20} strokeWidth={1.8} />
                </span>
                <h3>{t(selected.label)}</h3>
              </div>
              <div className="ws-administration__section-body">{renderSection()}</div>
            </>
          ) : (
            <div className="ws-administration__restricted" role="status">
              {status === 'checking' ? (
                <Activity size={30} strokeWidth={1.7} aria-hidden="true" />
              ) : (
                <LockKeyhole size={30} strokeWidth={1.7} aria-hidden="true" />
              )}
              <h3>{t(status === 'checking' ? 'Verificando autorização administrativa...' : 'Acesso negado')}</h3>
              <p>
                {t(
                  status === 'checking'
                    ? 'Verificando autorização administrativa...'
                    : 'Sua sessão administrativa expirou ou não está autorizada. Realize novamente o login pelo Terminal.',
                )}
              </p>
            </div>
          )}
        </main>
      </div>
    </article>
  );
}

import { lazy, Suspense, useState } from 'react';

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { getAppDefinition, getRegisteredApps } from '../../core/appRegistry';
import AppErrorBoundary from '../../shared/components/AppErrorBoundary';
import { isAdminAuthenticated } from '../../services/authService';

/* === Carregamento dos aplicativos === */
/* ----- Criar componente assíncrono ----- */
function createAppComponent(app) {
  return lazy(() => {
    if (!app?.loadComponent) {
      throw new Error(t('Componente do aplicativo não encontrado.'));
    }

    return app.loadComponent();
  });
}

/* ----- Catálogo dos componentes ----- */
const appComponents = Object.fromEntries(
  getRegisteredApps()
    .filter((app) => app.implemented)
    .map((app) => [app.id, createAppComponent(app)]),
);

/* === Aplicativos em desenvolvimento === */
/* ----- Conteúdo provisório ----- */
function AppPlaceholder({ appName, instance }) {
  useLocale();

  return (
    <div className="desktop-window__content">
      <h2>{t(appName)}</h2>
      <p>{t('Aplicativo em desenvolvimento.')}</p>
      <small>
        {t('Instância:')} {instance.id.slice(0, 8)}
      </small>
    </div>
  );
}

/* === Hospedagem dos aplicativos === */
export default function AppHost({
  appName,
  instance,
  onWindowResize,
}) {

  /* ----- Idioma e definição do aplicativo ----- */
  useLocale();

  const app = getAppDefinition(instance.appId);

  /* ----- Estado de carregamento ----- */
  const [retry, setRetry] = useState(() => ({
    Component: appComponents[instance.appId],
    attempt: 0,
  }));

  const AppComponent = retry.Component;

  /* === Recuperação de falhas === */
  /* ----- Recarregar componente ----- */
  function retryApp() {
    const Component = createAppComponent(app);

    appComponents[app.id] = Component;

    setRetry((current) => ({
      Component,
      attempt: current.attempt + 1,
    }));
  }

  /* === Controle de acesso === */
  /* ----- Aplicativos indisponíveis publicamente ----- */
  if (
    !app?.public &&
    !(app?.id === 'administration' && isAdminAuthenticated())
  ) {
    return (
      <div className="desktop-window__content" role="alert">
        <h2>{t(appName)}</h2>
        <p>
          {t('Este aplicativo não está disponível para abertura pública.')}
        </p>
      </div>
    );
  }

  /* ----- Aplicativos ainda não implementados ----- */
  if (!app.implemented) {
    return (
      <AppPlaceholder
        appName={t(appName)}
        instance={instance}
      />
    );
  }

  /* === Renderização do aplicativo === */
  return (
    <AppErrorBoundary
      key={retry.attempt}
      onRetry={retryApp}
    >
      <Suspense
        fallback={
          <div className="desktop-window__content" role="status">
            <p>
              {t('Carregando')} {t(appName)}...
            </p>
          </div>
        }
      >
        <AppComponent
          instance={instance}
          {...(instance.appId === 'games' && onWindowResize
            ? { onWindowResize }
            : {})}
        />
      </Suspense>
    </AppErrorBoundary>
  );
}
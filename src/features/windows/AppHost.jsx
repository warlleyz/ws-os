import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { lazy, Suspense, useState } from 'react';
import { getAppDefinition, getRegisteredApps } from '../../core/appRegistry';
import AppErrorBoundary from '../../shared/components/AppErrorBoundary';
import { isAdminAuthenticated } from '../../services/authService';

function createAppComponent(app) {
  return lazy(() => {
    if (!app?.loadComponent) throw new Error(t('Componente do aplicativo não encontrado.'));
    return app.loadComponent();
  });
}

const appComponents = Object.fromEntries(
  getRegisteredApps()
    .filter((app) => app.implemented)
    .map((app) => [app.id, createAppComponent(app)]),
);

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

export default function AppHost({ appName, instance }) {
  useLocale();
  const app = getAppDefinition(instance.appId);
  const [retry, setRetry] = useState(() => ({
    Component: appComponents[instance.appId],
    attempt: 0,
  }));
  const AppComponent = retry.Component;
  function retryApp() {
    // Cria um novo lazy só na ação explícita de recuperação, preservando renders normais.
    const Component = createAppComponent(app);
    appComponents[app.id] = Component;
    setRetry((current) => ({ Component, attempt: current.attempt + 1 }));
  }

  if (
    !app?.public &&
    !(app?.id === 'administration' && isAdminAuthenticated())
  ) {
    return (
      <div className="desktop-window__content" role="alert">
        <h2>{t(appName)}</h2>
        <p>{t('Este aplicativo não está disponível para abertura pública.')}</p>
      </div>
    );
  }
  if (!app.implemented) return <AppPlaceholder appName={t(appName)} instance={instance} />;

  return (
    <AppErrorBoundary key={retry.attempt} onRetry={retryApp}>
      <Suspense
        fallback={
          <div className="desktop-window__content" role="status">
            <p>
              {t('Carregando')} {t(appName)}...
            </p>
          </div>
        }
      >
        <AppComponent instance={instance} />
      </Suspense>
    </AppErrorBoundary>
  );
}

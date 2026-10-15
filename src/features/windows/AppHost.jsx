import { lazy, Suspense, useState } from 'react';
import { getAppDefinition, getRegisteredApps } from '../../core/appRegistry';
import AppErrorBoundary from '../../shared/components/AppErrorBoundary';

function createAppComponent(app) {
  return lazy(() => {
    if (!app?.loadComponent) throw new Error('Componente do aplicativo não encontrado.');
    return app.loadComponent();
  });
}

const appComponents = Object.fromEntries(
  getRegisteredApps()
    .filter((app) => app.implemented)
    .map((app) => [app.id, createAppComponent(app)]),
);

function AppPlaceholder({ appName, instance }) {
  return (
    <div className="desktop-window__content">
      <h2>{appName}</h2>
      <p>Aplicativo em desenvolvimento.</p>
      <small>Instância: {instance.id.slice(0, 8)}</small>
    </div>
  );
}

export default function AppHost({ appName, instance }) {
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

  if (!app?.public) {
    return (
      <div className="desktop-window__content" role="alert">
        <h2>{appName}</h2>
        <p>Este aplicativo não está disponível para abertura pública.</p>
      </div>
    );
  }
  if (!app.implemented) return <AppPlaceholder appName={appName} instance={instance} />;

  return (
    <AppErrorBoundary key={retry.attempt} onRetry={retryApp}>
      <Suspense
        fallback={
          <div className="desktop-window__content" role="status">
            <p>Carregando {appName}...</p>
          </div>
        }
      >
        <AppComponent instance={instance} />
      </Suspense>
    </AppErrorBoundary>
  );
}

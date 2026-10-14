import { lazy, Suspense } from 'react';
import { getAppDefinition } from '../../core/appRegistry';
import AppErrorBoundary from '../../shared/components/AppErrorBoundary';

const appModules = import.meta.glob('../../apps/*/*.jsx');

const appComponents = Object.fromEntries(
  Object.entries(appModules).map(([path, loader]) => {
    const appId = path.split('/').at(-2);

    return [appId, lazy(loader)];
  }),
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

  if (!app?.implemented) {
    return <AppPlaceholder appName={appName} instance={instance} />;
  }

  const AppComponent = appComponents[instance.appId];

  if (!AppComponent) {
    return (
      <div className="desktop-window__content" role="alert">
        <h2>{appName}</h2>
        <p>Componente do aplicativo não encontrado.</p>
      </div>
    );
  }

  return (
    <AppErrorBoundary>
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
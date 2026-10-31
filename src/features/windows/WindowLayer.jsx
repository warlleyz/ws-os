import { memo } from 'react';
import { getAppDefinition } from '../../core/appRegistry';
import { activateApp, minimizeApp, closeApp } from '../../core/appManager';
import Window from './Window';

/* === Camada de janelas do Desktop === */
function WindowLayer({ appState, run }) {

  /* === Renderização das instâncias === */
  return (
    <div className="desktop__window-layer">
      {appState.instances.map((instance, index) => {

        /* ----- Estado de foco e sobreposição ----- */
        const focusIndex = appState.focusHistory.indexOf(instance.id);
        const isActive = appState.activeInstanceId === instance.id;

        /* ----- Janela da instância ----- */
        return (
          <Window
            key={instance.id}
            instance={instance}
            app={getAppDefinition(instance.appId)}
            active={isActive}
            zIndex={focusIndex >= 0 ? focusIndex + 1 : 0}
            offset={index % 6}
            onActivate={() => run(activateApp, instance.id)}
            onMinimize={() => run(minimizeApp, instance.id)}
            onClose={() => run(closeApp, instance.id)}
          />
        );
      })}
    </div>
  );
}

/* === Otimização de renderização === */
export default memo(WindowLayer);
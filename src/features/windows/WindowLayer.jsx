import Window from './Window';
import { getAppDefinition } from '../../core/appRegistry';
import { activateApp } from '../../core/appManager';
import { minimizeApp } from '../../core/appManager';
import { closeApp } from '../../core/appManager';

export default function WindowLayer({ appState, run }) {
  return (
    <div className="desktop__window-layer">
      {appState.instances.map((instance, index) => {
        const focusIndex = appState.focusHistory.indexOf(instance.id);
        const isActive = appState.activeInstanceId === instance.id;
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

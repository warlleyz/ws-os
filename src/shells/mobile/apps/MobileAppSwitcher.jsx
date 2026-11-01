import { X } from 'lucide-react';
import { getAppDefinition } from '../../../core/appRegistry';
import { AppIcon } from '../../../shared/components/AppIcon';
import { translate as t, useLocale } from '../../../shared/i18n/i18n';

/* === VISUALIZAÇÃO DE APLICATIVOS ABERTOS === */
export default function MobileAppSwitcher({ instances, activeInstanceId, onSelect, onClose, onHome }) {
  useLocale();
  return <section className="ws-mobile__switcher" aria-label="Aplicativos recentes">
    <div className="ws-mobile__screen-header"><div><small>WS OS</small><h1>Recentes</h1></div><button type="button" onClick={onHome}>Início</button></div>
    {instances.length === 0 ? <p className="ws-mobile__empty">Nenhum aplicativo aberto.</p> : <div className="ws-mobile__switcher-list">{[...instances].reverse().map((instance) => {
      const app = getAppDefinition(instance.appId);
      if (!app || instance.closing) return null;
      return <article key={instance.id} className="ws-mobile__switcher-card" data-active={instance.id === activeInstanceId}>
        <button type="button" className="ws-mobile__switcher-select" onClick={() => onSelect(instance)}><span className="ws-mobile__switcher-preview"><AppIcon app={app} size={48} /></span><strong>{t(app.name)}</strong></button>
        <button type="button" className="ws-mobile__switcher-close" aria-label={`${t('Fechar')} ${t(app.name)}`} onClick={() => onClose(instance.id)}><X size={17} /></button>
      </article>;
    })}</div>}
  </section>;
}

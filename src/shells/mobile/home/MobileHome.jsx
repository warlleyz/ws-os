import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, GripVertical, Minus, Plus, RotateCcw } from 'lucide-react';
import { setMobilePreferences, useMobilePreferences, resetMobilePreferences } from '../../../core/mobilePreferences';
import { AppIcon } from '../../../shared/components/AppIcon';
import { translate as t, useLocale } from '../../../shared/i18n/i18n';

/* === CONFIGURAÇÃO === */
const APPS_PER_PAGE = 12;
const LONG_PRESS_MS = 520;

/* === ITEM DA HOME === */
function AppTile({ app, editing, inDock = false, onOpen, onEdit, onMove, onTouchEdit }) {
  const timer = useRef(null);
  const start = useRef(null);
  const suppress = useRef(false);
  function clear() { if (timer.current) clearTimeout(timer.current); timer.current = null; }
  useEffect(() => clear, []);
  function startPress(event) {
    if (editing || event.button !== 0) return;
    suppress.current = false;
    start.current = { x: event.clientX, y: event.clientY };
    clear();
    timer.current = setTimeout(() => { suppress.current = true; onTouchEdit(); }, LONG_PRESS_MS);
  }
  function movePress(event) {
    if (!start.current) return;
    if (Math.abs(event.clientX - start.current.x) > 10 || Math.abs(event.clientY - start.current.y) > 10) clear();
  }
  function click(event) {
    if (suppress.current) { event.preventDefault(); suppress.current = false; return; }
    if (!editing) onOpen(app.id);
  }
  return (
    <div className={`ws-mobile__tile-wrap${inDock ? ' ws-mobile__tile-wrap--dock' : ''}`}>
      <button type="button" className={inDock ? 'ws-mobile__dock-app' : 'ws-mobile__home-app'}
        draggable={editing} onDragStart={(event) => { event.dataTransfer.setData('text/plain', app.id); event.dataTransfer.effectAllowed = 'move'; }}
        onDragOver={(event) => editing && event.preventDefault()}
        onDrop={(event) => { if (!editing) return; event.preventDefault(); onMove(event.dataTransfer.getData('text/plain'), app.id, inDock); }}
        onPointerDown={startPress} onPointerMove={movePress}
        onPointerUp={clear} onPointerCancel={clear} onPointerLeave={clear}
        onContextMenu={(event) => { event.preventDefault(); onTouchEdit(); }}
        onClick={click} aria-label={t(app.name)}>
        <span className={inDock ? 'ws-mobile__dock-icon' : 'ws-mobile__home-app-icon'}><AppIcon app={app} size={27} /></span>
        {!inDock && <span className="ws-mobile__home-app-name">{t(app.name)}</span>}
      </button>
      {editing && <button type="button" className="ws-mobile__tile-edit" aria-label={`${inDock ? 'Remover do Dock' : 'Adicionar ao Dock'}: ${t(app.name)}`}
        onClick={() => onEdit(app.id, inDock ? 'remove' : 'add')}>
        {inDock ? <Minus size={12} /> : <Plus size={12} />}
      </button>}
    </div>
  );
}

/* === HOME MOBILE === */
export default function MobileHome({ apps, onOpenApp, onOpenDrawer }) {
  useLocale();
  const preferences = useMobilePreferences();
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(false);
  const touch = useRef(null);
  const swallow = useRef(false);
  const byId = useMemo(() => new Map(apps.map((app) => [app.id, app])), [apps]);
  const dock = preferences.dockAppIds.map((id) => byId.get(id)).filter(Boolean);
  const dockSet = new Set(dock.map((app) => app.id));
  const order = [...new Set([...preferences.homeAppIds, ...apps.map((app) => app.id)])];
  const home = order.map((id) => byId.get(id)).filter((app) => app && !dockSet.has(app.id));
  const pages = Array.from({ length: Math.max(1, Math.ceil(home.length / APPS_PER_PAGE)) }, (_, i) => home.slice(i * APPS_PER_PAGE, (i + 1) * APPS_PER_PAGE));
  const selectedPage = Math.min(page, pages.length - 1);
  function editDock(id, action) {
    const nextDock = action === 'add' ? [...preferences.dockAppIds, id] : preferences.dockAppIds.filter((item) => item !== id);
    if (nextDock.length > 4) return;
    setMobilePreferences({ dockAppIds: nextDock, homeAppIds: order });
  }
  function moveApp(source, target, targetDock) {
    if (!byId.has(source) || !byId.has(target) || source === target) return;
    if (targetDock) {
      const next = preferences.dockAppIds.filter((id) => id !== source);
      const index = next.indexOf(target);
      if (index < 0) return;
      next.splice(index, 0, source);
      setMobilePreferences({ dockAppIds: next.slice(0, 4), homeAppIds: order });
    } else {
      const next = order.filter((id) => id !== source);
      const index = next.indexOf(target);
      if (index < 0) return;
      next.splice(index, 0, source);
      setMobilePreferences({ homeAppIds: next, dockAppIds: preferences.dockAppIds.filter((id) => id !== source) });
    }
  }
  function swipeEnd(event) {
    const start = touch.current;
    touch.current = null;
    if (!start || editing || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy) * 1.3) return;
    const next = Math.max(0, Math.min(pages.length - 1, selectedPage + (dx < 0 ? 1 : -1)));
    if (next !== selectedPage) { setPage(next); swallow.current = true; }
  }
  return (
    <section className="ws-mobile__home" data-editing={editing} aria-label={t('Início')}>
      <div className="ws-mobile__home-tools">
        <span className="ws-mobile__home-brand">WS OS</span>
        {editing ? <div className="ws-mobile__tool-actions">
          <button type="button" onClick={() => resetMobilePreferences()} aria-label="Restaurar organização"><RotateCcw size={17} /></button>
          <button type="button" onClick={() => setEditing(false)}><Check size={16} /> Concluir</button>
        </div> : <button type="button" onClick={() => setEditing(true)}>Editar</button>}
      </div>
      <div className="ws-mobile__home-pages" onTouchStart={(event) => { if (event.touches.length === 1) touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
        onTouchEnd={swipeEnd} onTouchCancel={() => { touch.current = null; }}
        onClickCapture={(event) => { if (swallow.current) { event.preventDefault(); event.stopPropagation(); swallow.current = false; } }}>
        <div className="ws-mobile__home-grid">
          {pages[selectedPage].map((app) => <AppTile key={app.id} app={app} editing={editing} onOpen={onOpenApp} onEdit={editDock} onMove={moveApp} onTouchEdit={() => setEditing(true)} />)}
        </div>
      </div>
      <div className="ws-mobile__home-dots" aria-label="Páginas">
        {pages.map((_, index) => <button key={index} type="button" className={index === selectedPage ? 'is-active' : ''} aria-label={`Página ${index + 1}`} aria-current={index === selectedPage ? 'page' : undefined} onClick={() => setPage(index)}><span /></button>)}
      </div>
      <nav className="ws-mobile__dock" aria-label={t('Aplicativos favoritos')}>
        {dock.map((app) => <AppTile key={app.id} app={app} editing={editing} inDock onOpen={onOpenApp} onEdit={editDock} onMove={moveApp} onTouchEdit={() => setEditing(true)} />)}
        {editing && dock.length < 4 && <span className="ws-mobile__dock-empty"><GripVertical size={20} /></span>}
      </nav>
      <button type="button" className="ws-mobile__drawer-launcher" onClick={onOpenDrawer} disabled={editing}>Todos os aplicativos <span>⌃</span></button>
    </section>
  );
}

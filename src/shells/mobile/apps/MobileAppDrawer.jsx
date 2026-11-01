import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { AppIcon } from '../../../shared/components/AppIcon';
import { translate as t, useLocale } from '../../../shared/i18n/i18n';

/* === CATÁLOGO DE APLICATIVOS === */
export default function MobileAppDrawer({ apps, onOpenApp, onBack }) {
  useLocale();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => apps.filter((app) => t(app.name).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => t(a.name).localeCompare(t(b.name))), [apps, query]);
  return <section className="ws-mobile__drawer" aria-label="Todos os aplicativos">
    <div className="ws-mobile__screen-header"><div><small>WS OS</small><h1>Aplicativos</h1></div><button type="button" aria-label="Fechar" onClick={onBack}><X size={20} /></button></div>
    <label className="ws-mobile__search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar aplicativos" aria-label="Pesquisar aplicativos" /></label>
    <div className="ws-mobile__drawer-grid">{filtered.map((app) => <button key={app.id} type="button" className="ws-mobile__home-app" onClick={() => onOpenApp(app.id)}><span className="ws-mobile__home-app-icon"><AppIcon app={app} size={27} /></span><span className="ws-mobile__home-app-name">{t(app.name)}</span></button>)}</div>
    {filtered.length === 0 && <p className="ws-mobile__empty">Nenhum aplicativo encontrado.</p>}
  </section>;
}

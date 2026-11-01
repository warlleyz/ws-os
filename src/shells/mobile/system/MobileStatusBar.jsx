import { useEffect, useState } from 'react';
import { Bell, Settings2 } from 'lucide-react';
import { translate as t, useLocale } from '../../../shared/i18n/i18n';

/* === BARRA DE STATUS === */
export default function MobileStatusBar({ unreadCount = 0, activePanel, onTogglePanel }) {
  const locale = useLocale();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(id); }, []);
  return <header className="ws-mobile__status-bar"><time dateTime={now.toISOString()}>{now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</time>
    <div className="ws-mobile__status-actions">
      <button type="button" aria-label={t('Notificações')} aria-expanded={activePanel === 'notifications'} onClick={() => onTogglePanel('notifications')}><Bell size={19} />{unreadCount > 0 && <span className="ws-mobile__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>
      <button type="button" aria-label={t('Controle Rápido')} aria-expanded={activePanel === 'controls'} onClick={() => onTogglePanel('controls')}><Settings2 size={19} /></button>
    </div></header>;
}

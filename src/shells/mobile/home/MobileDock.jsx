import { AppIcon } from '../../../shared/components/AppIcon';
import { translate as t, useLocale } from '../../../shared/i18n/i18n';

/* === CONFIGURAÇÃO DO DOCK === */
const DEFAULT_DOCK_APPS = [
    'about-me',
    'projects',
    'resume',
    'contact',
];

const MAX_DOCK_APPS = 4;

/* === DOCK MOBILE === */
export default function MobileDock({
    apps,
    appIds = DEFAULT_DOCK_APPS,
    onOpenApp,
}) {
    useLocale();

    /* ----- Aplicativos disponíveis ----- */
    const dockApps = [...new Set(appIds)]
        .slice(0, MAX_DOCK_APPS)
        .map((id) => apps.find((app) => app.id === id))
        .filter(Boolean);

    /* === RENDERIZAÇÃO === */
    return (
        <nav
            className="ws-mobile__dock"
            aria-label={t('Aplicativos favoritos')}
        >
            {dockApps.map((app) => (
                <button
                    key={app.id}
                    type="button"
                    className="ws-mobile__dock-app"
                    aria-label={t(app.name)}
                    title={t(app.name)}
                    onClick={() => onOpenApp(app.id)}
                >
                    <span className="ws-mobile__dock-icon" aria-hidden="true">
                        <AppIcon app={app} size={27} />
                    </span>
                </button>
            ))}
        </nav>
    );
}
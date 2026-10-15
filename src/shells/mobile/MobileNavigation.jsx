
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { House, Grid2X2, Search } from 'lucide-react';

export default function MobileNavigation({ activeScreen, onNavigate }) {
    useLocale();

    const items = [
        { id: 'home', label: 'Início', Icon: House },
        { id: 'catalog', label: 'Aplicativos', Icon: Grid2X2 },
        { id: 'search', label: 'Buscar', Icon: Search },
    ];

    return (
        <nav className="ws-mobile__navigation" aria-label={t('Navegação Mobile')}>
            {items.map(({ id, label, Icon }) => (
                <button
                    key={id}
                    type="button"
                    className={activeScreen === id ? 'ws-mobile__nav-active' : ''}
                    aria-current={activeScreen === id ? 'page' : undefined}
                    onClick={() => onNavigate(id)}
                >
                    <Icon size={19} aria-hidden="true" />
                    <span>{t(label)}</span>
                </button>
            ))}
        </nav>
    );
}

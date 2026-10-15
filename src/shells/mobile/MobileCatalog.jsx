
import { useEffect, useRef, useState } from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { normalizeSearch } from '../../features/search/searchService';
import { AppIcon } from '../../shared/components/AppIcon';

export default function MobileCatalog({
    apps,
    onOpenApp,
    searchMode = false,
}) {
    const locale = useLocale();
    const [search, setSearch] = useState('');
    const searchRef = useRef(null);

    useEffect(() => {
        if (searchMode) {
            searchRef.current?.focus();
        }
    }, [searchMode]);

    const term = normalizeSearch(search.trim());

    const visibleApps = apps
        .filter((app) =>
            normalizeSearch(`${t(app.name)} ${app.id}`).includes(term),
        )
        .sort((a, b) => t(a.name).localeCompare(t(b.name), locale));

    return (
        <section className="ws-mobile__catalog">
            <h1>
                {searchMode ? t('Buscar') : t('Todos os aplicativos')}
            </h1>

            <label className="ws-mobile__search">
                <span>{t('Pesquisar na WS OS')}</span>
                <input
                    ref={searchRef}
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t('Pesquisar na WS OS...')}
                />
            </label>

            {visibleApps.length === 0 ? (
                <p role="status">{t('Nenhum aplicativo encontrado.')}</p>
            ) : (
                <div className="ws-mobile__grid">
                    {visibleApps.map((app) => (
                        <button
                            key={app.id}
                            type="button"
                            className="ws-mobile__app-button"
                            onClick={() => onOpenApp(app.id)}
                        >
                            <span className="ws-mobile__app-icon">
                                <AppIcon app={app} size={24} />
                            </span>
                            <span>{t(app.name)}</span>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}

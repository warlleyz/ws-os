import { useState } from 'react';
import { Award, Download, ExternalLink, Search } from 'lucide-react';
import { portfolio, contentText } from '../../content/portfolioContent';
import { safeExternalUrl, publicAssetUrl } from '../../shared/utils/urls';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { openApp } from '../../core/appManager';
import { useSystem } from '../../core/useSystem';
import { fileKind } from '../../services/storage/fileModel';
import '../../styles/apps.css';
import './Certificates.css';

const certificates = portfolio.certificates;

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'course', label: 'Cursos' },
  { id: 'certification', label: 'Certificações' },
  { id: 'achievement', label: 'Conquistas' },
];

export default function Certificates({ instance }) {
  const locale = useLocale();
  const { run } = useSystem();
  /* ----- Comprovantes locais usam o mesmo contrato público do Visualizador ----- */
  function openCertificate(item, url) {
    run(openApp, 'file-viewer', {
      origin: 'certificates',
      ...(instance?.id ? { originInstanceId: instance.id } : {}),
      params: { url, name: contentText(item.title, locale) },
    });
  }

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const normalizedSearch = search
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();

  const visibleCertificates = certificates.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;

    const searchableContent = [
      contentText(item.title, locale),
      contentText(item.issuer, locale),
      contentText(item.description, locale),
    ]
      .filter(Boolean)
      .join(' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase();

    return matchesCategory && searchableContent.includes(normalizedSearch);
  });

  return (
    <section className="desktop-window__content ws-app ws-certificates">
      <header>
        <h2>{t('Certificados')}</h2>
        <p>{t('Cursos, certificações e conquistas profissionais.')}</p>
      </header>

      <div className="ws-certificates__filters">
        <label>
          <span>{t('Pesquisar certificados')}</span>

          <div className="ws-certificates__search">
            <Search size={18} aria-hidden="true" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('Pesquisar certificados')}
            />
          </div>
        </label>

        <label>
          <span>{t('Categoria')}</span>

          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {t(item.label)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p role="status">
        {t('Resultados')}: {visibleCertificates.length}
      </p>

      {visibleCertificates.length === 0 ? (
        <div className="ws-certificates__empty">
          <Award size={36} strokeWidth={1.5} aria-hidden="true" />

          <h3>{t('Nenhum certificado encontrado')}</h3>

          <p>
            {certificates.length === 0
              ? t('Os certificados ainda não foram cadastrados.')
              : t('Tente alterar a pesquisa ou os filtros.')}
          </p>
        </div>
      ) : (
        <div className="ws-certificates__list">
          {visibleCertificates.map((item) => (
            <article key={item.id} className="ws-certificates__item">
              <Award size={22} aria-hidden="true" />

              <div>
                <h3>{contentText(item.title, locale)}</h3>
                <p>{contentText(item.issuer, locale)}</p>
                {item.description && <p>{contentText(item.description, locale)}</p>}
                {item.date && (
                  <time dateTime={item.date}>
                    {/^\d{4}-\d{2}-\d{2}$/.test(item.date)
                      ? new Date(item.date + 'T00:00:00Z').toLocaleDateString(locale, {
                          timeZone: 'UTC',
                        })
                      : item.date}
                  </time>
                )}
              </div>

              <div className="ws-certificates__actions">
                {publicAssetUrl(item.url) &&
                fileKind(new URL(publicAssetUrl(item.url)).pathname) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openCertificate(item, publicAssetUrl(item.url))}
                    >
                      <Award size={16} aria-hidden="true" />
                      {t('Visualizar')}
                    </button>
                    <a href={publicAssetUrl(item.url)} download>
                      <Download size={16} aria-hidden="true" />
                      {t('Baixar')}
                    </a>
                  </>
                ) : (
                  (safeExternalUrl(item.url) ?? publicAssetUrl(item.url)) && (
                    <a
                      href={safeExternalUrl(item.url) ?? publicAssetUrl(item.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={16} aria-hidden="true" />
                      {t('Abrir em site externo')}
                    </a>
                  )
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

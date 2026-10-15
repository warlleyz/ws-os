import { portfolio, contentText } from '../../content/portfolioContent';
import { safeExternalUrl, publicAssetUrl } from '../../shared/utils/urls';

import { useState } from 'react';
import { Award, ExternalLink, Search } from 'lucide-react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import './Certificates.css';

const certificates = portfolio.certificates;

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'course', label: 'Cursos' },
  { id: 'certification', label: 'Certificações' },
  { id: 'achievement', label: 'Conquistas' },
];

export default function Certificates() {
  const locale = useLocale();

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
    <section className="desktop-window__content">
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
                {item.date && <small>{item.date}</small>}
              </div>

              {(safeExternalUrl(item.url) ?? publicAssetUrl(item.url)) && (
                <a
                  href={safeExternalUrl(item.url) ?? publicAssetUrl(item.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  {t('Visualizar')}
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  Search,
  Trophy,
  X,
  Check,
} from 'lucide-react';

import { portfolio, contentText } from '../../content/portfolioContent';
import { publicAssetUrl, safeExternalUrl } from '../../shared/utils/urls';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { openApp } from '../../core/appManager';
import { useSystem } from '../../core/useSystem';
import { fileKind } from '../../services/storage/fileModel';
import useAppBack from '../../shared/hooks/useAppBack';

import '../../styles/apps.css';
import './Certificates.css';

/* === Configuração === */
const CERTIFICATES = portfolio.certificates ?? [];

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'course', label: 'Cursos' },
  { id: 'event', label: 'Eventos' },
  { id: 'lecture', label: 'Palestras' },
  { id: 'other', label: 'Outros' },
];

/* === Utilitários === */
function readText(value, locale) {
  return contentText(value, locale) || '';
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}

function getCategory(item) {
  if (['course', 'event', 'lecture', 'other'].includes(item.category)) {
    return item.category;
  }

  if (item.category === 'achievement' && item.url?.includes('/events/')) {
    return 'event';
  }

  return 'other';
}

function getCategoryLabel(category) {
  return CATEGORIES.find((item) => item.id === category)?.label ?? 'Outros';
}

function formatCertificateDate(value, locale, full = false) {
  if (!value) return '';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return String(value);
  }

  const date = new Date(`${value}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(locale, {
    ...(full ? { day: 'numeric' } : {}),
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function getCertificateYear(item) {
  return /^\d{4}-/.test(item.date ?? '')
    ? item.date.slice(0, 4)
    : '—';
}

function getTags(item, locale) {
  if (!Array.isArray(item.tags)) return [];

  return item.tags
    .map((tag) => readText(tag, locale))
    .filter(Boolean);
}

function getCertificateResource(item) {
  if (typeof item.url !== 'string' || !item.url.trim()) {
    return null;
  }

  const external = safeExternalUrl(item.url);

  if (external) {
    return { type: 'external', url: external };
  }

  const local = publicAssetUrl(item.url);

  if (!local) return null;

  try {
    const kind = fileKind(new URL(local, 'https://ws.local').pathname);

    return {
      type: kind ? 'local' : 'external',
      url: local,
    };
  } catch {
    return null;
  }
}

/* === Ícones das categorias === */
function CategoryIcon({ category, size = 20 }) {
  switch (category) {
    case 'course':
      return <GraduationCap size={size} strokeWidth={1.7} aria-hidden="true" />;
    case 'event':
      return <CalendarDays size={size} strokeWidth={1.7} aria-hidden="true" />;
    case 'lecture':
      return <BookOpen size={size} strokeWidth={1.7} aria-hidden="true" />;
    case 'other':
      return <Trophy size={size} strokeWidth={1.7} aria-hidden="true" />;
    default:
      return <Award size={size} strokeWidth={1.7} aria-hidden="true" />;
  }
}

/* === Cabeçalho principal === */
function CertificatesHeader() {
  return (
    <header className="ws-certificates__hero">
      <div className="ws-certificates__hero-copy">
        <span className="ws-certificates__eyebrow">
          WS OS / CERTIFICATES
        </span>

        <h2>{t('Certificados')}</h2>

        <p>{t('Cursos, certificações e conquistas profissionais.')}</p>
      </div>

      <Award
        className="ws-certificates__hero-icon"
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </header>
  );
}

/* === Filtros e pesquisa === */
function CertificatesToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
}) {
  return (
    <div className="ws-certificates__toolbar">
      <div
        className="ws-certificates__categories"
        role="group"
        aria-label={t('Categoria')}
      >
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={category === item.id ? 'is-active' : ''}
            aria-pressed={category === item.id}
            onClick={() => onCategoryChange(item.id)}
          >
            {t(item.label)}
          </button>
        ))}
      </div>

      <div className="ws-certificates__search">
        <Search size={17} aria-hidden="true" />

        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('Pesquisar certificados')}
          aria-label={t('Pesquisar certificados')}
        />

        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label={t('Limpar')}
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

/* === Card de certificado === */
function CertificateCard({ item, locale, onSelect }) {
  const title = readText(item.title, locale);
  const issuer = readText(item.issuer, locale);
  const category = getCategory(item);
  const date = formatCertificateDate(item.date, locale);
  const workload = readText(item.workload, locale);

  return (
    <article className="ws-certificates__card">
      <button
        type="button"
        className="ws-certificates__card-button"
        onClick={() => onSelect(item.id)}
        aria-label={`${t('Ver detalhes')}: ${title}`}
      >
        {/* === Identificação === */}
        <div className="ws-certificates__card-top">
          <span className="ws-certificates__card-category">
            {t(getCategoryLabel(category))}
          </span>

          <span className="ws-certificates__card-symbol">
            <CategoryIcon category={category} size={19} />
          </span>
        </div>

        {/* === Conteúdo === */}
        <div className="ws-certificates__card-information">
          <h3>{title}</h3>

          {issuer && (
            <p className="ws-certificates__card-issuer">
              {issuer}
            </p>
          )}
        </div>

        {/* === Informações e navegação === */}
        <div className="ws-certificates__card-bottom">
          <div className="ws-certificates__card-meta">
            {date && <span>{date}</span>}

            {workload && (
              <span>{workload}</span>
            )}
          </div>

          <span className="ws-certificates__card-action">
            {t('Ver detalhes')}
            <ArrowRight size={16} aria-hidden="true" />
          </span>
        </div>
      </button>
    </article>
  );
}

/* === Navegação da tela de detalhes === */
function DetailsNavigation({ onBack }) {
  return (
    <nav
      className="ws-certificates__details-navigation"
      aria-label={t('Certificados')}
    >
      <button
        type="button"
        className="ws-certificates__back"
        onClick={onBack}
      >
        <ArrowLeft size={17} aria-hidden="true" />
        {t('Voltar')}
      </button>

      <span>{t('Certificados')}</span>
    </nav>
  );
}

/* === Detalhes do certificado === */
function CertificateDetails({ item, locale, onBack, onOpen }) {
  const title = readText(item.title, locale);
  const issuer = readText(item.issuer, locale);
  const description = readText(item.description, locale);
  const workload = readText(item.workload, locale);
  const category = getCategory(item);
  const tags = getTags(item, locale);

  const subjects =
    getCategory(item) === 'course' && Array.isArray(item.subjects)
      ? item.subjects.map((subject) => readText(subject, locale)).filter(Boolean)
      : [];

  const resource = getCertificateResource(item);
  const date = formatCertificateDate(item.date, locale, true);

  const facts = [
    date && {
      id: 'date',
      label: t('Data'),
      value: date,
      icon: CalendarDays,
    },
    workload && {
      id: 'workload',
      label: t('Carga horária'),
      value: workload,
      icon: Clock3,
    },
    {
      id: 'category',
      label: t('Categoria'),
      value: t(getCategoryLabel(category)),
      icon: Award,
    },
  ].filter(Boolean);

  return (
    <div className="ws-certificates__details">
      {/* === Navegação === */}
      <DetailsNavigation onBack={onBack} />

      {/* === Identificação do certificado === */}
      <header className="ws-certificates__details-header">
        <span className="ws-certificates__details-icon">
          <CategoryIcon category={category} size={29} />
        </span>

        <div className="ws-certificates__details-title">
          <span className="ws-certificates__details-category">
            {t(getCategoryLabel(category))}
          </span>

          <h2>{title}</h2>

          {issuer && <p>{issuer}</p>}
        </div>
      </header>

      {/* === Metadados === */}
      <section
        className="ws-certificates__details-facts"
        aria-label={t('Detalhes')}
      >
        {facts.map((fact) => {
          const Icon = fact.icon;

          return (
            <div className="ws-certificates__fact" key={fact.id}>
              <span className="ws-certificates__fact-icon">
                <Icon size={17} aria-hidden="true" />
              </span>

              <div>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            </div>
          );
        })}
      </section>

      {/* === Conteúdo do certificado === */}
      {(description || subjects.length > 0) && (
        <section className="ws-certificates__details-content">
          {/* === Apresentação === */}
          {description && (
            <div className="ws-certificates__details-about">
              <div className="ws-certificates__section-heading">
                <BookOpen size={18} aria-hidden="true" />
                <h3>
                  {locale === 'en'
                    ? 'About'
                    : category === 'course'
                      ? 'Sobre o curso'
                      : 'Sobre'}
                </h3>
              </div>

              <p>{description}</p>
            </div>
          )}

          {/* === Conteúdo estudado === */}
          {subjects.length > 0 && (
            <div className="ws-certificates__subjects">
              <div className="ws-certificates__section-heading">
                <BookOpen size={18} aria-hidden="true" />
                <h3>
                  {locale === 'en'
                    ? 'Topics covered'
                    : 'Conteúdo estudado'}
                </h3>
              </div>

              <ul className="ws-certificates__subjects-list">
                {subjects.map((subject) => (
                  <li key={subject}>
                    <Check size={15} aria-hidden="true" />
                    <span>{subject}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* === Competências e assuntos === */}
      {tags.length > 0 && (
        <div className="ws-certificates__tags">
          {tags.map((tag, index) => (
            <span key={`${index}-${tag}`}>{tag}</span>
          ))}
        </div>
      )}

      {/* === Documento comprobatório === */}
      {resource && (
        <section className="ws-certificates__document">
          <div className="ws-certificates__document-heading">
            <span className="ws-certificates__document-icon">
              <FileText size={22} aria-hidden="true" />
            </span>

            <div className="ws-certificates__document-description">
              <h3>
                {locale === 'en'
                  ? 'Certificate document'
                  : 'Documento do certificado'}
              </h3>

              <p>
                {locale === 'en'
                  ? 'View or download the official document.'
                  : 'Visualize ou baixe o documento oficial.'}
              </p>
            </div>

            {resource.type === 'local' && (
              <span className="ws-certificates__document-type">
                PDF
              </span>
            )}
          </div>

          <div className="ws-certificates__document-actions">
            {resource.type === 'local' ? (
              <>
                <button
                  type="button"
                  className="ws-certificates__primary-action"
                  onClick={() => onOpen(item, resource.url)}
                >
                  <Eye size={17} aria-hidden="true" />
                  {t('Visualizar')}
                </button>

                <a
                  className="ws-certificates__secondary-action"
                  href={resource.url}
                  download
                >
                  <Download size={17} aria-hidden="true" />
                  {t('Baixar')}
                </a>
              </>
            ) : (
              <a
                className="ws-certificates__primary-action"
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={17} aria-hidden="true" />
                {t('Abrir em site externo')}
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/* === Aplicativo Certificados === */
export default function Certificates({ instance }) {
  const locale = useLocale();
  const { run } = useSystem();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  const selected =
    CERTIFICATES.find((item) => item.id === selectedId) ?? null;

  /* === Navegação do sistema === */
  useAppBack(instance?.id, () => {
    if (!selectedId) return false;

    setSelectedId(null);
    return true;
  });

  /* === Abertura do documento === */
  function openCertificate(item, url) {
    run(openApp, 'file-viewer', {
      origin: 'certificates',
      ...(instance?.id
        ? { originInstanceId: instance.id }
        : {}),
      params: {
        url,
        name: readText(item.title, locale),
      },
    });
  }

  /* === Pesquisa e filtros === */
  const visible = useMemo(() => {
    const query = normalize(search);

    return CERTIFICATES
      .filter((item) => {
        const matchesCategory =
          category === 'all' || getCategory(item) === category;

        const searchable = normalize([
          readText(item.title, locale),
          readText(item.issuer, locale),
          readText(item.description, locale),
          readText(item.workload, locale),
          ...getTags(item, locale),
        ].join(' '));

        return matchesCategory && searchable.includes(query);
      })
      .sort((a, b) =>
        String(b.date ?? '').localeCompare(String(a.date ?? ''))
      );
  }, [search, category, locale]);

  /* === Agrupamento por ano === */
  const grouped = useMemo(() => {
    const groups = new Map();

    for (const item of visible) {
      const year = getCertificateYear(item);

      if (!groups.has(year)) {
        groups.set(year, []);
      }

      groups.get(year).push(item);
    }

    return [...groups.entries()];
  }, [visible]);

  /* === Interface === */
  return (
    <section className="desktop-window__content ws-app ws-certificates">
      {selected ? (
        <CertificateDetails
          item={selected}
          locale={locale}
          onBack={() => setSelectedId(null)}
          onOpen={openCertificate}
        />
      ) : (
        <>
          <CertificatesHeader />

          <CertificatesToolbar
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
          />

          <div className="ws-certificates__content">

            {visible.length === 0 ? (
              <div className="ws-certificates__empty">
                <Award
                  size={38}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />

                <h3>{t('Nenhum certificado encontrado')}</h3>

                <p>
                  {CERTIFICATES.length === 0
                    ? t('Os certificados ainda não foram cadastrados.')
                    : t('Tente alterar a pesquisa ou os filtros.')}
                </p>
              </div>
            ) : (
              grouped.map(([year, items]) => (
                <section
                  className="ws-certificates__year"
                  key={year}
                >
                  <div className="ws-certificates__year-heading">
                    <span>{year}</span>
                    <div aria-hidden="true" />
                    <small>
                      {items.length}{' '}
                      {locale === 'en'
                        ? items.length === 1
                          ? 'certificate'
                          : 'certificates'
                        : items.length === 1
                          ? 'certificado'
                          : 'certificados'}
                    </small>
                  </div>

                  <div className="ws-certificates__grid">
                    {items.map((item) => (
                      <CertificateCard
                        key={item.id}
                        item={item}
                        locale={locale}
                        onSelect={setSelectedId}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { useState } from 'react';
import {
  Download,
  ExternalLink,
  FileImage,
  FileText,
  Info,
  Minus,
  Plus,
  RotateCw,
  X,
} from 'lucide-react';
import PdfPreview from './PdfPreview';

/* === Interface compartilhada do visualizador === */
/* ----- Documento em primeiro plano; metadados sob demanda ----- */
function DocumentViewContent({
  name,
  origin,
  kind,
  blob,
  url,
  text,
  size,
  mimeType,
  updatedAt,
  revision,
  loading = false,
  error = '',
  onImageError,
  previewError = false,
}) {
  const locale = useLocale();
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const downloadable = Boolean(url);
  const Icon = kind === 'image' ? FileImage : FileText;

  return (
    <article className="desktop-window__content ws-app ws-file-viewer">
      {/* === Identificação e ações === */}
      <header className="ws-file-viewer__header">
        <div className="ws-file-viewer__identity">
          <span className="ws-file-viewer__file-icon">
            <Icon size={22} aria-hidden="true" />
          </span>
          <div className="ws-file-viewer__identity-content">
            <span className="ws-file-viewer__eyebrow">{t('Visualizador de Arquivos')}</span>
            <h2 title={name}>{name || t('Nenhum arquivo selecionado')}</h2>
            <p>
              {t(origin)} ·{' '}
              {kind === 'pdf'
                ? 'PDF'
                : kind === 'image'
                  ? t('Imagem')
                  : kind === 'text'
                    ? t('Texto')
                    : t('Arquivo')}{' '}
              · {t('Somente leitura')}
            </p>
          </div>
        </div>
        <div className="ws-file-viewer__actions">
          {downloadable && (
            <a href={url} download={name}>
              <Download size={16} aria-hidden="true" />
              {t('Baixar')}
            </a>
          )}
          {downloadable && (
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={16} aria-hidden="true" />
              {t('Abrir')}
            </a>
          )}
          <button
            type="button"
            aria-label={t('Propriedades do arquivo')}
            title={t('Propriedades do arquivo')}
            aria-expanded={propertiesOpen}
            aria-pressed={propertiesOpen}
            onClick={() => setPropertiesOpen((open) => !open)}
          >
            <Info size={17} aria-hidden="true" />
            {t('Detalhes')}
          </button>
        </div>
      </header>
      {/* === Pré-visualização e painel opcional === */}
      <div className={`ws-file-viewer__workspace${propertiesOpen ? ' has-details' : ''}`}>
        <div className="ws-file-viewer__content">
          {loading && (
            <div className="ws-file-viewer__empty" role="status">
              {t('Carregando arquivo...')}
            </div>
          )}
          {error && !loading && (
            <div className="ws-file-viewer__empty" role="alert">
              <h3>{t('Não foi possível abrir o arquivo')}</h3>
              <p>{t(error)}</p>
            </div>
          )}
          {!loading && !error && !blob && (
            <div className="ws-file-viewer__empty" role="status">
              <h3>{t('Pré-visualização indisponível')}</h3>
              <p>
                {t('O arquivo não está disponível para visualização. Tente baixar o documento.')}
              </p>
            </div>
          )}
          {!loading && !error && blob && kind === 'pdf' && <PdfPreview blob={blob} name={name} />}
          {!loading && !error && blob && kind === 'image' && (
            <section className="ws-file-viewer__image-container">
              <div
                className="ws-file-viewer__pdf-tools"
                role="toolbar"
                aria-label={t('Controles da imagem')}
              >
                <button
                  type="button"
                  aria-label={t('Diminuir zoom')}
                  title={t('Diminuir zoom')}
                  onClick={() => setImageZoom((value) => Math.max(0.25, value - 0.25))}
                  disabled={imageZoom <= 0.25}
                >
                  <Minus size={17} />
                </button>
                <span className="ws-file-viewer__zoom-value">{Math.round(imageZoom * 100)}%</span>
                <button
                  type="button"
                  aria-label={t('Aumentar zoom')}
                  title={t('Aumentar zoom')}
                  onClick={() => setImageZoom((value) => Math.min(3, value + 0.25))}
                  disabled={imageZoom >= 3}
                >
                  <Plus size={17} />
                </button>
                <button type="button" onClick={() => setImageZoom(1)}>
                  {t('Ajustar à janela')}
                </button>
                <button
                  type="button"
                  aria-label={t('Girar imagem')}
                  title={t('Girar imagem')}
                  onClick={() => setRotation((value) => (value + 90) % 360)}
                >
                  <RotateCw size={17} />
                </button>
              </div>
              <div className="ws-file-viewer__image-viewport">
                {previewError ? (
                  <p role="alert">{t('Não foi possível exibir esta imagem.')}</p>
                ) : (
                  <img
                    src={url}
                    alt={name}
                    onError={onImageError}
                    style={{
                      width: `${imageZoom * 100}%`,
                      maxWidth: 'none',
                      transform: `rotate(${rotation}deg)`,
                    }}
                  />
                )}
              </div>
            </section>
          )}
          {!loading && !error && blob && kind === 'text' && (
            <pre className="ws-file-viewer__text">
              <code>{text}</code>
            </pre>
          )}
          {!loading && !error && blob && !['pdf', 'image', 'text'].includes(kind) && (
            <div className="ws-file-viewer__empty" role="status">
              {t('Formato não disponível para pré-visualização.')}
            </div>
          )}
        </div>
        {propertiesOpen && (
          <aside className="ws-file-viewer__properties" aria-label={t('Propriedades do arquivo')}>
            <div className="ws-file-viewer__properties-heading">
              <h3>{t('Propriedades')}</h3>
              <button
                type="button"
                aria-label={t('Fechar propriedades')}
                title={t('Fechar propriedades')}
                onClick={() => setPropertiesOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <dl>
              <dt>{t('Nome')}</dt>
              <dd>{name || '—'}</dd>
              <dt>{t('Origem')}</dt>
              <dd>{t(origin)}</dd>
              <dt>{t('Tipo')}</dt>
              <dd>{mimeType || kind || t('Desconhecido')}</dd>
              <dt>{t('Tamanho')}</dt>
              <dd>{Number.isFinite(size) ? `${size.toLocaleString(locale)} bytes` : '—'}</dd>
              {updatedAt && (
                <>
                  <dt>{t('Modificado')}</dt>
                  <dd>{new Date(updatedAt).toLocaleString(locale)}</dd>
                </>
              )}
              {revision != null && (
                <>
                  <dt>{t('Revisão')}</dt>
                  <dd>{revision}</dd>
                </>
              )}
              <dt>{t('Acesso')}</dt>
              <dd>{t('Somente leitura')}</dd>
            </dl>
          </aside>
        )}
      </div>
    </article>
  );
}

/* === Identidade do documento === */
/* ----- Reinicialização dos controles ao trocar de arquivo ----- */
export default function DocumentView(props) {
  return <DocumentViewContent key={`${props.name ?? ''}:${props.url ?? ''}`} {...props} />;
}

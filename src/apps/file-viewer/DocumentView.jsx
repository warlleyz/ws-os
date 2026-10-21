import { useState } from 'react';
import { Download, ExternalLink, FileImage, FileText, Info, Minus, Plus, RotateCw, X } from 'lucide-react';
import PdfPreview from './PdfPreview';

/* === Interface compartilhada do visualizador === */
/* ----- Documento em primeiro plano; metadados sob demanda ----- */
function DocumentViewContent({ name, origin, kind, blob, url, text, size, mimeType, updatedAt, revision, loading = false, error = '', onImageError, previewError = false }) {
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
          <span className="ws-file-viewer__file-icon"><Icon size={22} aria-hidden="true" /></span>
          <div className="ws-file-viewer__identity-content">
            <span className="ws-file-viewer__eyebrow">Visualizador de Arquivos</span>
            <h2 title={name}>{name || 'Nenhum arquivo selecionado'}</h2>
            <p>{origin} · {kind === 'pdf' ? 'PDF' : kind === 'image' ? 'Imagem' : kind === 'text' ? 'Texto' : 'Arquivo'} · Somente leitura</p>
          </div>
        </div>
        <div className="ws-file-viewer__actions">
          {downloadable && <a href={url} download={name}><Download size={16} aria-hidden="true" /> Baixar</a>}
          {downloadable && <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" /> Abrir</a>}
          <button type="button" aria-label="Propriedades do arquivo" aria-expanded={propertiesOpen} aria-pressed={propertiesOpen} onClick={() => setPropertiesOpen((open) => !open)}><Info size={17} aria-hidden="true" /> Detalhes</button>
        </div>
      </header>
      {/* === Pré-visualização e painel opcional === */}
      <div className={`ws-file-viewer__workspace${propertiesOpen ? ' has-details' : ''}`}>
        <div className="ws-file-viewer__content">
          {loading && <div className="ws-file-viewer__empty" role="status">Carregando arquivo...</div>}
          {error && !loading && <div className="ws-file-viewer__empty" role="alert"><h3>Não foi possível abrir o arquivo</h3><p>{error}</p></div>}
          {!loading && !error && !blob && <div className="ws-file-viewer__empty" role="status"><h3>Pré-visualização indisponível</h3><p>O arquivo não está disponível para visualização. Tente baixar o documento.</p></div>}
          {!loading && !error && blob && kind === 'pdf' && <PdfPreview blob={blob} name={name} />}
          {!loading && !error && blob && kind === 'image' && (
            <section className="ws-file-viewer__image-container">
              <div className="ws-file-viewer__pdf-tools" role="toolbar" aria-label="Controles da imagem">
                <button type="button" aria-label="Diminuir zoom" onClick={() => setImageZoom((value) => Math.max(0.25, value - 0.25))} disabled={imageZoom <= 0.25}><Minus size={17} /></button>
                <span className="ws-file-viewer__zoom-value">{Math.round(imageZoom * 100)}%</span>
                <button type="button" aria-label="Aumentar zoom" onClick={() => setImageZoom((value) => Math.min(3, value + 0.25))} disabled={imageZoom >= 3}><Plus size={17} /></button>
                <button type="button" onClick={() => setImageZoom(1)}>Ajustar à janela</button>
                <button type="button" aria-label="Girar imagem" onClick={() => setRotation((value) => (value + 90) % 360)}><RotateCw size={17} /></button>
              </div>
              <div className="ws-file-viewer__image-viewport">
                {previewError ? <p role="alert">Não foi possível exibir esta imagem.</p> : <img src={url} alt={name} onError={onImageError} style={{ width: `${imageZoom * 100}%`, maxWidth: 'none', transform: `rotate(${rotation}deg)` }} />}
              </div>
            </section>
          )}
          {!loading && !error && blob && kind === 'text' && <pre className="ws-file-viewer__text"><code>{text}</code></pre>}
          {!loading && !error && blob && !['pdf', 'image', 'text'].includes(kind) && <div className="ws-file-viewer__empty" role="status">Formato não disponível para pré-visualização.</div>}
        </div>
        {propertiesOpen && (
          <aside className="ws-file-viewer__properties" aria-label="Propriedades do arquivo">
            <div className="ws-file-viewer__properties-heading"><h3>Propriedades</h3><button type="button" aria-label="Fechar propriedades" onClick={() => setPropertiesOpen(false)}><X size={16} /></button></div>
            <dl>
              <dt>Nome</dt><dd>{name || '—'}</dd>
              <dt>Origem</dt><dd>{origin}</dd>
              <dt>Tipo</dt><dd>{mimeType || kind || 'Desconhecido'}</dd>
              <dt>Tamanho</dt><dd>{Number.isFinite(size) ? `${size.toLocaleString('pt-BR')} bytes` : '—'}</dd>
              {updatedAt && <><dt>Modificado</dt><dd>{new Date(updatedAt).toLocaleString('pt-BR')}</dd></>}
              {revision != null && <><dt>Revisão</dt><dd>{revision}</dd></>}
              <dt>Acesso</dt><dd>Somente leitura</dd>
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
  return (
    <DocumentViewContent
      key={`${props.name ?? ''}:${props.url ?? ''}`}
      {...props}
    />
  );
}
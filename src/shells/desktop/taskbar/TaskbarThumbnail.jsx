import { useLayoutEffect, useRef } from 'react';

/* === Miniatura efêmera: somente conteúdo profissional público visível === */
const permitted = new Set([
  'about-me',
  'projects',
  'dev-insights',
  'resume',
  'certificates',
  'about-system',
]);
export default function TaskbarThumbnail({ instance, children }) {
  const host = useRef(null);
  useLayoutEffect(() => {
    if (!permitted.has(instance.appId) || instance.minimized || !host.current) return;
    const source = document.querySelector(
      '[data-instance-id="' + instance.id + '"] .desktop-window__content',
    );
    if (!source) return;
    const rect = source.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0)) return;
    let svg;
    try {
      const clone = source.cloneNode(true);
      /* ----- Nenhum formulário, recurso incorporado ou referência navegável ----- */
      for (const node of clone.querySelectorAll(
        'form,input,textarea,select,iframe,object,embed,video,audio,canvas,img,script,style,[contenteditable]',
      ))
        node.remove();
      for (const node of [clone, ...clone.querySelectorAll('*')]) {
        for (const attribute of [...node.attributes]) {
          if (
            /^on/i.test(attribute.name) ||
            ['id', 'href', 'src', 'srcset', 'tabindex', 'autofocus', 'data-instance-id'].includes(
              attribute.name,
            )
          )
            node.removeAttribute(attribute.name);
        }
        node.style.animation = 'none';
        node.style.transition = 'none';
        node.style.backgroundImage = 'none';
      }
      // Substitui controles restantes por texto estático, sem semântica interativa.
      for (const node of clone.querySelectorAll('button,a')) {
        const text = document.createElement('span');
        text.className = node.className;
        text.textContent = node.textContent;
        node.replaceWith(text);
      }
      clone.inert = true;
      Object.assign(clone.style, {
        width: rect.width + 'px',
        height: rect.height + 'px',
        maxWidth: 'none',
        margin: '0',
        overflow: 'hidden',
      });
      const ns = 'http://www.w3.org/2000/svg';
      svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
      svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');
      svg.setAttribute('aria-hidden', 'true');
      svg.classList.add('taskbar-preview__snapshot');
      const content = document.createElementNS(ns, 'foreignObject');
      content.setAttribute('width', String(rect.width));
      content.setAttribute('height', String(rect.height));
      content.append(clone);
      svg.append(content);
      host.current.append(svg);
    } catch {
      svg?.remove();
    }
    return () => svg?.remove();
  }, [instance.id, instance.appId, instance.minimized]);
  return (
    <span ref={host} className="taskbar-preview__placeholder" aria-hidden="true">
      {children}
    </span>
  );
}

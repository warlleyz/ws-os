import { useEffect, useLayoutEffect, useRef } from 'react';

export default function PanelLayer({ layerRef, children, onDismiss }) {
  const currentPanel = useRef(null);
  const trigger = useRef(null);
  const dismiss = useRef(onDismiss);
  useLayoutEffect(() => {
    dismiss.current = onDismiss;
  }, [onDismiss]);
  useLayoutEffect(() => {
    const panel = layerRef.current?.firstElementChild;
    if (currentPanel.current === panel) return;
    currentPanel.current = panel;
    if (!panel || panel.matches(".taskbar-preview")) return;
    if (!panel.contains(document.activeElement)) {
      trigger.current = document.activeElement;
      const first =
        panel.querySelector('input[type=search]:not(:disabled)') ??
        panel.querySelector('button:not(:disabled),select:not(:disabled),[tabindex="0"]');
      first?.focus();
    }
  }, [children, layerRef]);
  useEffect(() => {
    function onFocus(event) {
      const panel = layerRef.current?.firstElementChild;
      if (panel && !panel.contains(event.target) && !event.target.closest('.taskbar-container'))
        dismiss.current?.();
    }
    document.addEventListener('focusin', onFocus);
    return () => document.removeEventListener('focusin', onFocus);
  }, [layerRef]);
  return (
    <div
      ref={layerRef}
      className="taskbar-floating-layer"
      onKeyDown={(event) => {
        if (
          event.key !== 'Escape' ||
          event.target.closest('.ws-menu__context,.taskbar-context,.taskbar-preview')
        )
          return;
        event.preventDefault();
        event.stopPropagation();
        dismiss.current?.();
        trigger.current?.focus();
      }}
      onClickCapture={(event) => {
        const button = event.target.closest('button');
        if (
          button?.closest('header') &&
          /^(Fechar|Close)\b/.test(button.getAttribute('aria-label') ?? '')
        )
          queueMicrotask(() => trigger.current?.focus());
      }}
    >
      {children}
    </div>
  );
}

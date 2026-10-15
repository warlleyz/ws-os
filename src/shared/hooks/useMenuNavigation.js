import { useEffect, useRef } from 'react';

// Grupos de ações contextuais mantêm semântica de botões, com navegação equivalente.
export default function useMenuNavigation(menuRef, contextKey) {
  const originRef = useRef(null);
  useEffect(() => {
    const element = menuRef.current;
    if (!element?.contains(document.activeElement)) originRef.current = document.activeElement;
    const origin = originRef.current;
    const buttons = () => Array.from(element?.querySelectorAll('button:not(:disabled)') ?? []);
    buttons()[0]?.focus();
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        queueMicrotask(() => origin?.focus());
        return;
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      const items = buttons();
      if (!items.length) return;
      event.preventDefault();
      event.stopPropagation();
      const index = items.indexOf(document.activeElement);
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next].focus();
    }
    element?.addEventListener('keydown', onKeyDown);
    return () => element?.removeEventListener('keydown', onKeyDown);
  }, [menuRef, contextKey]);
}

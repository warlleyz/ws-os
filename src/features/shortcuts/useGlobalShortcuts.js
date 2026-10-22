import { useEffect } from 'react';
export default function useGlobalShortcuts({
  clearWindowHighlight,
  clearPreviewTimers,
  setPreviewGroup,
  setContextGroup,
  setShortcutContext,
  contextTriggerRef,
  shortcutTriggerRef,
  setMenuView,
  setMenuSearch,
  setActivePanel,
  onShowDesktop,
  shortcutContext,
  menuOpen,
  menuButtonRef,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.defaultPrevented || event.isComposing) return;
      const key = event.code;
      if (
        event.ctrlKey &&
        event.shiftKey &&
        !event.altKey &&
        !event.repeat &&
        event.code === 'Space'
      ) {
        event.preventDefault();
        event.stopPropagation();
        clearWindowHighlight();
        clearPreviewTimers();
        setPreviewGroup(null);
        setContextGroup(null);
        setShortcutContext(null);
        contextTriggerRef.current = null;
        shortcutTriggerRef.current = null;
        setMenuView('home');
        setMenuSearch('');
        setActivePanel((current) => (current === 'menu' ? null : 'menu'));
        return;
      }
      if (key === 'KeyD') {
        if (event.ctrlKey && event.altKey && !event.repeat) {
          event.preventDefault();
          clearWindowHighlight();
          clearPreviewTimers();
          setPreviewGroup(null);
          setContextGroup(null);
          setShortcutContext(null);
          setActivePanel(null);
          contextTriggerRef.current = null;
          shortcutTriggerRef.current = null;
          onShowDesktop?.();
          return;
        }
      }
      if (event.key !== 'Escape') return;
      if (shortcutContext) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
        setShortcutContext(null);
        shortcutTriggerRef.current?.focus();
        return;
      }
      clearWindowHighlight();
      clearPreviewTimers();
      if (contextTriggerRef.current) {
        contextTriggerRef.current.focus();
      } else if (menuOpen) {
        menuButtonRef.current?.focus();
      }
      setPreviewGroup(null);
      setContextGroup(null);
      setShortcutContext(null);
      setActivePanel(null);
      contextTriggerRef.current = null;
      shortcutTriggerRef.current = null;
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    clearWindowHighlight,
    clearPreviewTimers,
    setPreviewGroup,
    setContextGroup,
    setShortcutContext,
    contextTriggerRef,
    shortcutTriggerRef,
    setMenuView,
    setMenuSearch,
    setActivePanel,
    onShowDesktop,
    shortcutContext,
    menuOpen,
    menuButtonRef,
  ]);
}

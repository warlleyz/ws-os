import { useCallback, useEffect, useRef, useState } from 'react';
// Utilitários e preferências persistentes do WS Menu.
export default function useTaskbarPreviews({
  groups,
  appState,
  onPreviewOpen,
}) {
  const [previewGroup, setPreviewGroup] = useState(null);
  const previewOpenTimerRef = useRef(null);
  const previewCloseTimerRef = useRef(null);
  const previewRef = useRef(null);
  const highlightedWindowRef = useRef(null);
  const keyboardTriggerRef = useRef(null);
  const [previewFocusHistory, setPreviewFocusHistory] = useState(appState.focusHistory);
  if (previewFocusHistory !== appState.focusHistory) {
    setPreviewFocusHistory(appState.focusHistory);
    setPreviewGroup(null);
  }
  const preview = groups.find((group) => group.appId === previewGroup);
  const clearWindowHighlight = useCallback(() => {
    const element = highlightedWindowRef.current;
    if (element) {
      delete element.dataset.taskbarPreview;
    }
    highlightedWindowRef.current = null;
  }, []);
  function highlightWindow(instance) {
    clearWindowHighlight();
    if (instance.minimized) return;
    const element = document.querySelector(`[data-instance-id="${instance.id}"]`);
    if (!element) return;
    element.dataset.taskbarPreview = 'true';
    highlightedWindowRef.current = element;
  }
  const clearPreviewTimers = useCallback(() => {
    window.clearTimeout(previewOpenTimerRef.current);
    window.clearTimeout(previewCloseTimerRef.current);
  }, []);
  function closePreview(restoreFocus = false) {
    if (restoreFocus) keyboardTriggerRef.current?.focus();
    keyboardTriggerRef.current = null;
    clearWindowHighlight();
    clearPreviewTimers();
    setPreviewGroup(null);
  }
  function openPreview(appId, keyboardTrigger = null) {
    clearPreviewTimers();
    keyboardTriggerRef.current = keyboardTrigger;
    onPreviewOpen?.();
    setPreviewGroup(appId);
    if (keyboardTrigger && previewGroup === appId) {
      previewRef.current?.querySelector('button')?.focus();
    }
  }
  function schedulePreviewOpen(appId) {
    clearPreviewTimers();

    previewOpenTimerRef.current = window.setTimeout(() => {
      openPreview(appId);
    }, 300);
  }
  function schedulePreviewClose() {
    window.clearTimeout(previewOpenTimerRef.current);
    window.clearTimeout(previewCloseTimerRef.current);
    previewCloseTimerRef.current = window.setTimeout(() => {
      if (
        previewRef.current?.matches(':hover') ||
        previewRef.current?.contains(document.activeElement)
      ) return;
      clearWindowHighlight();
      setPreviewGroup(null);
    }, 300);
  }
  useEffect(() => {
    const element = highlightedWindowRef.current;
    if (!element) return;
    const instanceId = element.dataset.instanceId;
    const instance = appState.instances.find((item) => item.id === instanceId);
    if (!instance || instance.minimized || !element.isConnected) {
      delete element.dataset.taskbarPreview;
      highlightedWindowRef.current = null;
    }
  }, [appState.instances]);
  useEffect(() => {
    if (previewGroup && keyboardTriggerRef.current) {
      previewRef.current?.querySelector('button')?.focus();
    }
  }, [previewGroup]);
  // Cancela aberturas pendentes e destaque ao mudar foco ou desmontar a Taskbar.
  useEffect(() => () => {
    clearPreviewTimers();
    clearWindowHighlight();
  }, [appState.focusHistory, clearPreviewTimers, clearWindowHighlight]);
  // Fechamento e alternância de painéis flutuantes.
  return {
    previewGroup,
    setPreviewGroup,
    previewCloseTimerRef,
    previewRef,
    preview,
    clearWindowHighlight,
    highlightWindow,
    clearPreviewTimers,
    closePreview,
    openPreview,
    schedulePreviewOpen,
    schedulePreviewClose,
  };
}

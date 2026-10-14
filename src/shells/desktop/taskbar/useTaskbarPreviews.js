import { useEffect, useRef, useState } from 'react';
// Utilitários e preferências persistentes do WS Menu.
export default function useTaskbarPreviews({ groups, appState }) {
  const [previewGroup, setPreviewGroup] = useState(null);
  const previewOpenTimerRef = useRef(null);
  const previewCloseTimerRef = useRef(null);
  const previewRef = useRef(null);
  const highlightedWindowRef = useRef(null);
  const preview = groups.find((group) => group.appId === previewGroup);
  function clearWindowHighlight() {
    const element = highlightedWindowRef.current;
    if (element) {
      delete element.dataset.taskbarPreview;
    }
    highlightedWindowRef.current = null;
  }
  function highlightWindow(instance) {
    clearWindowHighlight();
    if (instance.minimized) return;
    const element = document.querySelector(`[data-instance-id="${instance.id}"]`);
    if (!element) return;
    element.dataset.taskbarPreview = 'true';
    highlightedWindowRef.current = element;
  }
  function clearPreviewTimers() {
    window.clearTimeout(previewOpenTimerRef.current);
    window.clearTimeout(previewCloseTimerRef.current);
  }
  function closePreview() {
    clearWindowHighlight();
    clearPreviewTimers();
    setPreviewGroup(null);
  }
  function schedulePreviewOpen(appId) {
    clearPreviewTimers();
    previewOpenTimerRef.current = window.setTimeout(() => {
      setPreviewGroup(appId);
    }, 300);
  }
  function schedulePreviewClose() {
    window.clearTimeout(previewOpenTimerRef.current);
    window.clearTimeout(previewCloseTimerRef.current);
    previewCloseTimerRef.current = window.setTimeout(() => {
      if (previewRef.current?.matches(':hover')) return;
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
    schedulePreviewOpen,
    schedulePreviewClose,
  };
}

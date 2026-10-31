import { useCallback, useEffect, useRef, useState } from 'react';

/* === Gerenciamento das prévias da Taskbar === */
export default function useTaskbarPreviews({
  groups,
  appState,
  onPreviewOpen,
}) {

  /* === Estados das prévias === */
  /* ----- Aplicativo selecionado ----- */
  const [previewGroup, setPreviewGroup] = useState(null);

  /* ----- Histórico de foco ----- */
  const [previewFocusHistory, setPreviewFocusHistory] = useState(
    appState.focusHistory,
  );

  /* === Referências === */
  /* ----- Temporizadores ----- */
  const previewOpenTimerRef = useRef(null);
  const previewCloseTimerRef = useRef(null);

  /* ----- Elementos e navegação ----- */
  const previewRef = useRef(null);
  const highlightedWindowRef = useRef(null);
  const keyboardTriggerRef = useRef(null);

  /* === Sincronização do foco === */
  /* ----- Fechar prévia ao alterar o histórico ----- */
  if (previewFocusHistory !== appState.focusHistory) {
    setPreviewFocusHistory(appState.focusHistory);
    setPreviewGroup(null);
  }

  /* ----- Localizar grupo selecionado ----- */
  const preview = groups.find(
    (group) => group.appId === previewGroup,
  );

  /* === Destaque das janelas === */
  /* ----- Remover destaque ----- */
  const clearWindowHighlight = useCallback(() => {
    const element = highlightedWindowRef.current;

    if (element) {
      delete element.dataset.taskbarPreview;
    }

    highlightedWindowRef.current = null;
  }, []);

  /* ----- Destacar janela selecionada ----- */
  function highlightWindow(instance) {
    clearWindowHighlight();

    if (instance.minimized) return;

    const element = document.querySelector(
      `[data-instance-id="${instance.id}"]`,
    );

    if (!element) return;

    element.dataset.taskbarPreview = 'true';
    highlightedWindowRef.current = element;
  }

  /* === Temporizadores das prévias === */
  /* ----- Cancelar temporizadores ----- */
  const clearPreviewTimers = useCallback(() => {
    window.clearTimeout(previewOpenTimerRef.current);
    window.clearTimeout(previewCloseTimerRef.current);
  }, []);

  /* === Controle de abertura e fechamento === */
  /* ----- Fechar prévia ----- */
  function closePreview(restoreFocus = false) {
    if (restoreFocus) {
      keyboardTriggerRef.current?.focus();
    }

    keyboardTriggerRef.current = null;

    clearWindowHighlight();
    clearPreviewTimers();
    setPreviewGroup(null);
  }

  /* ----- Abrir prévia ----- */
  function openPreview(appId, keyboardTrigger = null) {
    clearPreviewTimers();

    keyboardTriggerRef.current = keyboardTrigger;

    onPreviewOpen?.();
    setPreviewGroup(appId);

    if (keyboardTrigger && previewGroup === appId) {
      previewRef.current
        ?.querySelector('button')
        ?.focus();
    }
  }

  /* ----- Agendar abertura ----- */
  function schedulePreviewOpen(appId) {
    clearPreviewTimers();

    previewOpenTimerRef.current = window.setTimeout(() => {
      openPreview(appId);
    }, 300);
  }

  /* ----- Agendar fechamento ----- */
  function schedulePreviewClose() {
    window.clearTimeout(previewOpenTimerRef.current);
    window.clearTimeout(previewCloseTimerRef.current);

    previewCloseTimerRef.current = window.setTimeout(() => {
      if (
        previewRef.current?.matches(':hover') ||
        previewRef.current?.contains(document.activeElement)
      ) {
        return;
      }

      clearWindowHighlight();
      setPreviewGroup(null);
    }, 300);
  }

  /* === Sincronização das instâncias === */
  /* ----- Remover destaques inválidos ----- */
  useEffect(() => {
    const element = highlightedWindowRef.current;

    if (!element) return;

    const instanceId = element.dataset.instanceId;

    const instance = appState.instances.find(
      (item) => item.id === instanceId,
    );

    if (
      !instance ||
      instance.minimized ||
      !element.isConnected
    ) {
      delete element.dataset.taskbarPreview;
      highlightedWindowRef.current = null;
    }
  }, [appState.instances]);

  /* === Navegação por teclado === */
  /* ----- Focar primeira ação da prévia ----- */
  useEffect(() => {
    if (previewGroup && keyboardTriggerRef.current) {
      previewRef.current
        ?.querySelector('button')
        ?.focus();
    }
  }, [previewGroup]);

  /* === Limpeza dos recursos === */
  /* ----- Cancelar temporizadores e destaque ----- */
  useEffect(() => {
    return () => {
      clearPreviewTimers();
      clearWindowHighlight();
    };
  }, [
    appState.focusHistory,
    clearPreviewTimers,
    clearWindowHighlight,
  ]);

  /* === Interface do hook === */
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
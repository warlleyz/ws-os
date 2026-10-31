import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import {
  clamp,
  getBounds,
  readGeometry,
  constrainGeometry,
  applyGeometry,
  resizeGeometry,
  getSnapMode,
} from './windowGeometry';

/* === Interação e geometria das janelas === */
export default function useWindowInteraction({ instance, app }) {

  /* ----- Referências e estado ----- */
  const windowRef = useRef(null);
  const geometryRef = useRef(null);
  const interactionRef = useRef(null);
  const interactionFrameRef = useRef(0);
  const previewRef = useRef(null);
  const modeRef = useRef('normal');
  const [mode, setMode] = useState('normal');
  const appName = app?.name ?? instance.appId;

  /* === Modos de exibição === */
  /* ----- Alterar modo da janela ----- */
  const changeMode = useCallback((nextMode) => {
    modeRef.current = nextMode;
    setMode(nextMode);
  }, []);

  /* ----- Maximizar ou restaurar ----- */
  function toggleMaximize() {
    if (interactionRef.current) return;

    if (modeRef.current === 'maximized') {
      changeMode('normal');
    } else {
      changeMode('maximized');
    }
  }

  /* === Prévia de encaixe === */
  /* ----- Remover prévia ----- */
  const removeSnapPreview = useCallback(() => {
    previewRef.current?.remove();
    previewRef.current = null;
  }, []);

  /* ----- Atualizar prévia ----- */
  function updateSnapPreview(nextMode) {
    const element = windowRef.current;
    const parent = element?.offsetParent;

    if (!parent || !nextMode) {
      removeSnapPreview();
      return;
    }

    if (!previewRef.current) {
      const preview = document.createElement('div');

      preview.setAttribute('aria-hidden', 'true');
      preview.style.pointerEvents = 'none';

      parent.appendChild(preview);
      previewRef.current = preview;
    }

    const preview = previewRef.current;
    const className =
      `desktop-window desktop-window--${nextMode} desktop-snap-preview`;

    if (preview.className !== className) {
      preview.className = className;
    }
  }

  /* === Recuperação das janelas === */
  /* ----- Recuperar janela fora da área visível ----- */
  function recoverWindow() {
    const element = windowRef.current;

    if (
      !element ||
      modeRef.current !== 'normal' ||
      interactionRef.current ||
      instance.minimized ||
      instance.closing
    ) {
      return;
    }

    const bounds = getBounds(element);
    const geometry = readGeometry(element);

    const outside =
      geometry.x < 0 ||
      geometry.y < 0 ||
      geometry.x + geometry.width > bounds.width ||
      geometry.y + geometry.height > bounds.height;

    if (!outside) return;

    geometryRef.current = applyGeometry(element, geometry, bounds);
  }

  /* === Dimensões das janelas === */
  /* ----- Redimensionamento solicitado pelo aplicativo ----- */
  function resizeWindow(size) {
    const element = windowRef.current;

    if (
      !element ||
      interactionRef.current ||
      !Number.isFinite(size?.width) ||
      !Number.isFinite(size?.height) ||
      size.width <= 0 ||
      size.height <= 0
    ) {
      return;
    }

    const bounds = getBounds(element);
    const current = geometryRef.current ?? readGeometry(element);

    /* ----- Limites disponíveis ----- */
    const width = Math.min(
      size.width,
      Math.max(0, bounds.width - 16),
    );

    const height = Math.min(
      size.height,
      Math.max(0, bounds.height - 16),
    );

    /* ----- Centralização ----- */
    const next = {
      ...current,
      x: Math.max(8, (bounds.width - width) / 2),
      y: Math.max(8, (bounds.height - height) / 2),
      width,
      height,
    };

    if (modeRef.current !== 'normal') {
      geometryRef.current = constrainGeometry(next, bounds);
      return;
    }

    geometryRef.current = applyGeometry(element, next, bounds);
  }

  /* === Inicialização da geometria === */
  /* ----- Aplicar dimensões iniciais ----- */
  useLayoutEffect(() => {
    const element = windowRef.current;

    if (!element) return;

    if (!geometryRef.current) {
      const defaults = app?.window;
      const geometry = readGeometry(element);

      if (
        defaults &&
        [
          'about-me',
          'projects',
          'dev-insights',
          'file-viewer',
          'file-editor',
          'files',
          'certificates',
          'contact',
          'terminal',
          'games',
          'notes',
          'about-system',
          'wally-extended',
          'calculator',
          'administration',
        ].includes(instance.appId)
      ) {
        const bounds = getBounds(element);
        const width = Math.min(defaults.width, bounds.width - 16);
        const height = Math.min(defaults.height, bounds.height - 16);

        geometryRef.current = {
          ...geometry,
          x: Math.max(8, (bounds.width - width) / 2),
          y: Math.max(8, (bounds.height - height) / 2),
          width,
          height,
        };
      } else {
        geometryRef.current = defaults
          ? {
            ...geometry,
            width: defaults.width,
            height: defaults.height,
          }
          : geometry;
      }
    }

    if (mode === 'normal') {
      geometryRef.current = applyGeometry(
        element,
        geometryRef.current,
        getBounds(element),
        false,
      );
    }
  }, [mode, app, instance.appId]);

  /* ----- Observar redimensionamento do Desktop ----- */
  useLayoutEffect(() => {
    const element = windowRef.current;
    const parent = element?.offsetParent;

    if (!element || !parent) return;

    let frame = 0;

    const observer = new ResizeObserver(([entry]) => {
      const bounds = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };

      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        if (modeRef.current !== 'normal' || !geometryRef.current) {
          return;
        }

        geometryRef.current = applyGeometry(
          element,
          geometryRef.current,
          bounds,
          true,
        );
      });
    });

    observer.observe(parent);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  /* === Controle das interações === */
  /* ----- Cancelar interação ativa ----- */
  const cancelInteraction = useCallback((interaction) => {
    const element = windowRef.current;

    cancelAnimationFrame(interactionFrameRef.current);
    interactionFrameRef.current = 0;
    interactionRef.current = null;

    if (element) {
      element.removeAttribute('data-interacting');

      geometryRef.current = applyGeometry(
        element,
        interaction.cancelGeometry,
        getBounds(element),
        true,
      );

      if (modeRef.current !== interaction.initialMode) {
        changeMode(interaction.initialMode);
      }
    }

    removeSnapPreview();

    const target = interaction.captureTarget;

    if (target?.hasPointerCapture?.(interaction.pointerId)) {
      target.releasePointerCapture(interaction.pointerId);
    }
  }, [changeMode, removeSnapPreview]);

  /* ----- Cancelar arraste com Escape ----- */
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;

      const interaction = interactionRef.current;

      if (!interaction) return;

      cancelInteraction(interaction);
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [cancelInteraction]);

  /* ----- Interromper interação ao minimizar ou fechar ----- */
  useEffect(() => {
    if (!instance.minimized && !instance.closing) return;

    windowRef.current?.removeAttribute('data-interacting');

    const interaction = interactionRef.current;

    cancelAnimationFrame(interactionFrameRef.current);
    interactionFrameRef.current = 0;
    interactionRef.current = null;

    if (interaction) {
      const target = interaction.captureTarget;

      if (target?.hasPointerCapture?.(interaction.pointerId)) {
        target.releasePointerCapture(interaction.pointerId);
      }
    }

    removeSnapPreview();
  }, [instance.minimized, instance.closing, removeSnapPreview]);

  /* ----- Limpeza ao desmontar ----- */
  useLayoutEffect(() => {
    return () => {
      const interaction = interactionRef.current;

      cancelAnimationFrame(interactionFrameRef.current);
      interactionFrameRef.current = 0;
      interactionRef.current = null;

      if (interaction) {
        const { captureTarget, pointerId } = interaction;

        if (captureTarget?.hasPointerCapture?.(pointerId)) {
          captureTarget.releasePointerCapture(pointerId);
        }
      }

      removeSnapPreview();
    };
  }, [removeSnapPreview]);

  /* === Movimentação e redimensionamento === */
  /* ----- Iniciar interação ----- */
  function startInteraction(event, type, direction = '') {
    if (event.button !== 0 || interactionRef.current) return;

    if (type === 'drag' && event.target.closest('button')) {
      return;
    }

    if (type === 'resize' && modeRef.current !== 'normal') {
      return;
    }

    const element = windowRef.current;

    if (!element) return;

    const bounds = getBounds(element);
    let geometry = geometryRef.current ?? readGeometry(element);

    const cancelGeometry = { ...geometry };
    const initialMode = modeRef.current;

    /* ----- Restaurar ao arrastar janela encaixada ----- */
    if (type === 'drag' && modeRef.current !== 'normal') {
      const rect = element.getBoundingClientRect();
      const parentRect = element.offsetParent.getBoundingClientRect();

      const relativeX = clamp(
        (event.clientX - rect.left) / Math.max(rect.width, 1),
        0,
        1,
      );

      const cursorOffsetY = clamp(
        event.clientY - rect.top,
        0,
        Math.min(46, geometry.height),
      );

      geometry = constrainGeometry(
        {
          ...geometry,
          x: event.clientX - parentRect.left - geometry.width * relativeX,
          y: event.clientY - parentRect.top - cursorOffsetY,
        },
        bounds,
      );

      changeMode('normal');
      geometryRef.current = applyGeometry(element, geometry);
    }

    element.setAttribute('data-interacting', 'true');

    interactionRef.current = {
      type,
      direction,
      cancelGeometry,
      initialMode,
      pointerId: event.pointerId,
      captureTarget: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      geometry: { ...geometry },
      lastX: event.clientX,
      lastY: event.clientY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  /* ----- Aplicar movimento do ponteiro ----- */
  function applyInteraction(event) {
    const interaction = interactionRef.current;

    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    const element = windowRef.current;

    if (!element) return;

    interaction.lastX = event.clientX;
    interaction.lastY = event.clientY;

    const dx = event.clientX - interaction.startX;
    const dy = event.clientY - interaction.startY;
    const initial = interaction.geometry;

    let next;

    if (interaction.type === 'drag') {
      next = {
        ...initial,
        x: initial.x + dx,
        y: initial.y + dy,
      };

      const bounds = getBounds(element);
      const parentRect = element.offsetParent?.getBoundingClientRect();

      const pointerX = event.clientX - (parentRect?.left ?? 0);
      const pointerY = event.clientY - (parentRect?.top ?? 0);

      const snapMode = getSnapMode(
        pointerX,
        pointerY,
        bounds.width,
        bounds.height,
      );

      updateSnapPreview(snapMode);
    } else {
      next = resizeGeometry(
        initial,
        interaction.direction,
        dx,
        dy,
        getBounds(element),
      );
    }

    geometryRef.current = applyGeometry(
      element,
      next,
      getBounds(element),
      interaction.type === 'drag',
    );
  }

  /* ----- Atualizar interação por animação ----- */
  function moveInteraction(event) {
    const interaction = interactionRef.current;

    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    interaction.lastX = event.clientX;
    interaction.lastY = event.clientY;

    if (interactionFrameRef.current) return;

    interactionFrameRef.current = requestAnimationFrame(() => {
      interactionFrameRef.current = 0;

      applyInteraction({
        pointerId: interaction.pointerId,
        clientX: interaction.lastX,
        clientY: interaction.lastY,
      });
    });
  }

  /* ----- Finalizar interação ----- */
  function endInteraction(event) {
    const interaction = interactionRef.current;

    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    if (event.type !== 'pointerup') {
      cancelInteraction(interaction);
      return;
    }

    cancelAnimationFrame(interactionFrameRef.current);
    interactionFrameRef.current = 0;

    applyInteraction(event);
    interactionRef.current = null;

    windowRef.current?.removeAttribute('data-interacting');
    removeSnapPreview();

    /* ----- Aplicar encaixe ao soltar ----- */
    if (interaction.type === 'drag') {
      const element = windowRef.current;

      if (element) {
        const bounds = getBounds(element);
        const parentRect = element.offsetParent?.getBoundingClientRect();

        const pointerX = interaction.lastX - (parentRect?.left ?? 0);
        const pointerY = interaction.lastY - (parentRect?.top ?? 0);

        const nextMode = getSnapMode(
          pointerX,
          pointerY,
          bounds.width,
          bounds.height,
        );

        if (nextMode) {
          changeMode(nextMode);
        }
      }
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  /* === Interações por teclado === */
  /* ----- Redimensionamento por teclado ----- */
  function handleResizeKeyDown(event, direction) {
    const allowedKeys = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
    ];

    if (!allowedKeys.includes(event.key)) return;

    event.preventDefault();

    const element = windowRef.current;

    if (!element || modeRef.current !== 'normal') return;

    const step = event.shiftKey ? 20 : 10;

    const dx =
      event.key === 'ArrowRight'
        ? step
        : event.key === 'ArrowLeft'
          ? -step
          : 0;

    const dy =
      event.key === 'ArrowDown'
        ? step
        : event.key === 'ArrowUp'
          ? -step
          : 0;

    const initial = geometryRef.current ?? readGeometry(element);

    const next = resizeGeometry(
      initial,
      direction,
      dx,
      dy,
      getBounds(element),
    );

    geometryRef.current = applyGeometry(element, next);
  }

  /* ----- Movimentação por teclado ----- */
  function handleMoveKeyDown(event) {
    if (
      !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
    ) {
      return;
    }

    event.preventDefault();

    const element = windowRef.current;

    if (!element || modeRef.current !== 'normal') return;

    const step = event.shiftKey ? 20 : 10;
    const initial = geometryRef.current ?? readGeometry(element);

    geometryRef.current = applyGeometry(
      element,
      {
        ...initial,
        x:
          initial.x +
          (event.key === 'ArrowRight'
            ? step
            : event.key === 'ArrowLeft'
              ? -step
              : 0),
        y:
          initial.y +
          (event.key === 'ArrowDown'
            ? step
            : event.key === 'ArrowUp'
              ? -step
              : 0),
      },
      getBounds(element),
      true,
    );
  }

  /* === Interface do hook === */
  return {
    windowRef,
    mode,
    appName,
    recoverWindow,
    resizeWindow,
    startInteraction,
    moveInteraction,
    endInteraction,
    toggleMaximize,
    handleResizeKeyDown,
    handleMoveKeyDown,
  };
}
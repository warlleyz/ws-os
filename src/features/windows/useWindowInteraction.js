import {
  clamp,
  getBounds,
  readGeometry,
  constrainGeometry,
  applyGeometry,
  resizeGeometry,
  getSnapMode,
} from './windowGeometry';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
export default function useWindowInteraction({ instance, app }) {
  const windowRef = useRef(null);
  const geometryRef = useRef(null);
  const interactionRef = useRef(null);
  const previewRef = useRef(null);
  const modeRef = useRef('normal');
  const [mode, setMode] = useState('normal');
  const appName = app?.name ?? instance.appId;
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      const interaction = interactionRef.current;
      if (!interaction) return;
      const element = windowRef.current;
      interactionRef.current = null;
      if (element) {
        geometryRef.current = applyGeometry(element, interaction.geometry);
      }
      previewRef.current?.remove();
      previewRef.current = null;
      const target = interaction.captureTarget;
      if (target?.hasPointerCapture(interaction.pointerId)) {
        target.releasePointerCapture(interaction.pointerId);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  useEffect(() => {
    if (!instance.minimized) return;
    const interaction = interactionRef.current;
    interactionRef.current = null;
    if (interaction) {
      const target = interaction.captureTarget;
      if (target?.hasPointerCapture(interaction.pointerId)) {
        target.releasePointerCapture(interaction.pointerId);
      }
    }
    previewRef.current?.remove();
    previewRef.current = null;
  }, [instance.minimized]);
  function removeSnapPreview() {
    previewRef.current?.remove();
    previewRef.current = null;
  }
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
    const className = `desktop-window desktop-window--${nextMode} desktop-snap-preview`;
    if (preview.className !== className) {
      preview.className = className;
    }
  }
  function changeMode(nextMode) {
    modeRef.current = nextMode;
    setMode(nextMode);
  }
  function toggleMaximize() {
    if (modeRef.current === 'normal') {
      changeMode('maximized');
    } else {
      changeMode('normal');
    }
  }

  // A geometria normal permanece preservada durante o snap.
  useLayoutEffect(() => {
    const element = windowRef.current;
    if (!element) return;
    if (!geometryRef.current) {
      geometryRef.current = readGeometry(element);
    }
    if (mode === 'normal') {
      geometryRef.current = applyGeometry(element, geometryRef.current);
    }
  }, [mode]);

  // Observa somente alterações reais no tamanho do Desktop.
  useLayoutEffect(() => {
    const element = windowRef.current;
    const parent = element?.offsetParent;
    if (!element || !parent) return;
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      const bounds = { width: entry.contentRect.width, height: entry.contentRect.height };
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (modeRef.current !== 'normal' || !geometryRef.current) {
          return;
        }
        geometryRef.current = applyGeometry(element, geometryRef.current, bounds);
      });
    });
    observer.observe(parent);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);
  useLayoutEffect(() => {
    return () => {
      previewRef.current?.remove();
      previewRef.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    return () => {
      const interaction = interactionRef.current;
      interactionRef.current = null;

      if (interaction) {
        const { captureTarget, pointerId } = interaction;

        if (captureTarget?.hasPointerCapture?.(pointerId)) {
          captureTarget.releasePointerCapture(pointerId);
        }
      }

      previewRef.current?.remove();
      previewRef.current = null;
    };
  }, []);
  function startInteraction(event, type, direction = '') {
    if (event.button !== 0) return;
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
    if (type === 'drag' && modeRef.current !== 'normal') {
      const rect = element.getBoundingClientRect();
      const parentRect = element.offsetParent.getBoundingClientRect();
      const relativeX = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
      const cursorOffsetY = clamp(event.clientY - rect.top, 0, Math.min(46, geometry.height));
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
    interactionRef.current = {
      type,
      direction,
      pointerId: event.pointerId,
      captureTarget: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      geometry: {
        ...geometry,
      },
      lastX: event.clientX,
      lastY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function moveInteraction(event) {
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
      const snapMode = getSnapMode(pointerX, pointerY, bounds.width, bounds.height);
      updateSnapPreview(snapMode);
    } else {
      next = resizeGeometry(initial, interaction.direction, dx, dy, getBounds(element));
    }
    geometryRef.current = applyGeometry(element, next);
  }
  function endInteraction(event) {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }
    interactionRef.current = null;
    removeSnapPreview();
    if (event.type === 'pointerup' && interaction.type === 'drag') {
      const element = windowRef.current;
      if (element) {
        const bounds = getBounds(element);
        const parentRect = element.offsetParent?.getBoundingClientRect();
        const pointerX = interaction.lastX - (parentRect?.left ?? 0);
        const pointerY = interaction.lastY - (parentRect?.top ?? 0);
        const nextMode = getSnapMode(pointerX, pointerY, bounds.width, bounds.height);
        if (nextMode) {
          changeMode(nextMode);
        }
      }
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }
  function handleResizeKeyDown(event, direction) {
    const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!allowedKeys.includes(event.key)) return;
    event.preventDefault();
    const element = windowRef.current;
    if (!element || modeRef.current !== 'normal') return;
    const step = event.shiftKey ? 20 : 10;
    const dx = event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0;
    const dy = event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0;
    const initial = geometryRef.current ?? readGeometry(element);
    const next = resizeGeometry(initial, direction, dx, dy, getBounds(element));
    geometryRef.current = applyGeometry(element, next);
  }
  return {
    windowRef,
    mode,
    appName,
    startInteraction,
    moveInteraction,
    endInteraction,
    toggleMaximize,
    handleResizeKeyDown,
  };
}

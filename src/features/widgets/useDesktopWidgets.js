import { COLUMN_STEP, ROW_STEP, getDesktopLayout } from '../../shells/desktop/desktopLayout';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSystem } from '../../core/useSystem';
import {
  loadWidgetPreferences,
  saveWidgetState,
  setWidgetVisibility,
  setWidgetPosition,
  setWidgetSize,
} from '../../core/widgetManager';

export default function useDesktopWidgets({ shortcuts, gridSize, shortcutPositions = {} }) {
  const { notify } = useSystem();
  const [initial] = useState(loadWidgetPreferences);
  const [widgetState, setWidgetState] = useState(initial.state);
  const saveWarningRef = useRef(false);
  const widgetDragRef = useRef(null);
  useEffect(() => {
    const saved =
      widgetState === initial.state && initial.error ? false : saveWidgetState(widgetState);
    if (saved) {
      saveWarningRef.current = false;
      return;
    }
    if (saveWarningRef.current) return;
    saveWarningRef.current = true;
    notify({
      title: 'Preferências dos widgets',
      message:
        'Não foi possível ler ou salvar as preferências. Os widgets continuam disponíveis nesta sessão; alterações podem não permanecer após recarregar.',
      source: 'Widgets',
      type: 'warning',
    });
  }, [widgetState, initial, notify]);
  const clockWidget = widgetState.widgets.find((widget) => widget.instanceId === 'clock-default');
  const preferred = shortcuts.map((app) => shortcutPositions[app.id]);
  const desktopLayout = getDesktopLayout(
    shortcuts.length,
    gridSize.width,
    gridSize.height,
    clockWidget,
    preferred,
  );
  function blocked() {
    notify({
      title: 'Sem espaço para o relógio',
      message:
        'Escolha outro tamanho ou uma posição livre. Os 12 atalhos e a área da barra de tarefas são preservados.',
      source: 'Widgets',
      type: 'warning',
    });
  }
  function getCandidateLayout(candidate) {
    return getDesktopLayout(
      shortcuts.length,
      gridSize.width,
      gridSize.height,
      candidate,
      preferred,
    );
  }
  function toggleClockWidget() {
    if (!clockWidget) return;
    if (!clockWidget.visible && !getCandidateLayout({ ...clockWidget, visible: true }).widget) {
      blocked();
      return;
    }
    setWidgetState((current) =>
      setWidgetVisibility(current, 'clock-default', !clockWidget.visible),
    );
  }
  function changeWidgetSize(value) {
    if (!['2x2', '3x2', '3x3'].includes(value)) return;
    const [columns, rows] = value.split('x').map(Number);
    if (!getCandidateLayout({ ...clockWidget, size: { columns, rows } }).widget) {
      blocked();
      return;
    }
    setWidgetState((current) => setWidgetSize(current, 'clock-default', { columns, rows }));
  }
  function placeWidget(column, row) {
    const candidate = { ...clockWidget, position: { column, row } };
    const layout = getCandidateLayout(candidate);
    if (
      !layout.widget ||
      layout.widget.left !== column * COLUMN_STEP ||
      layout.widget.top !== row * ROW_STEP
    ) {
      blocked();
      return;
    }
    setWidgetState((current) => setWidgetPosition(current, 'clock-default', { column, row }));
  }
  const cancelWidgetDrag = useCallback(() => {
    const drag = widgetDragRef.current;
    widgetDragRef.current = null;
    if (!drag) return null;
    drag.element.style.translate = '';
    drag.element.removeAttribute('data-drop-valid');
    if (drag.target.hasPointerCapture?.(drag.pointerId))
      drag.target.releasePointerCapture(drag.pointerId);
    return drag;
  }, []);
  useEffect(
    () => () => {
      cancelWidgetDrag();
    },
    [gridSize.width, gridSize.height, cancelWidgetDrag],
  );
  function startWidgetDrag(event) {
    if (event.button !== 0 || !desktopLayout.widget) return;
    const element = event.currentTarget.closest('.desktop__widget');
    widgetDragRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      target: event.currentTarget,
      element,
      left: desktopLayout.widget.left,
      top: desktopLayout.widget.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveWidgetDrag(event) {
    const drag = widgetDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.element.style.translate = `${dx}px ${dy}px`;
    const column = Math.round((drag.left + dx) / COLUMN_STEP);
    const row = Math.round((drag.top + dy) / ROW_STEP);
    const layout = getCandidateLayout({ ...clockWidget, position: { column, row } });
    const valid = Boolean(
      layout.widget &&
      layout.widget.left === column * COLUMN_STEP &&
      layout.widget.top === row * ROW_STEP,
    );
    drag.element.setAttribute('data-drop-valid', String(valid));
  }
  function finishWidgetDrag(event) {
    if (widgetDragRef.current?.pointerId !== event.pointerId) return;
    const drag = cancelWidgetDrag();
    if (event.type !== 'pointerup') return;
    placeWidget(
      Math.round((drag.left + event.clientX - drag.x) / COLUMN_STEP),
      Math.round((drag.top + event.clientY - drag.y) / ROW_STEP),
    );
  }
  function handleWidgetKeyDown(event) {
    if (event.key === 'Escape') {
      cancelWidgetDrag();
      return;
    }
    const directions = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (!directions[event.key] || !desktopLayout.widget) return;
    event.preventDefault();
    const [dx, dy] = directions[event.key];
    placeWidget(
      desktopLayout.widget.left / COLUMN_STEP + dx,
      desktopLayout.widget.top / ROW_STEP + dy,
    );
  }
  return {
    widgetState,
    toggleClockWidget,
    clockWidget,
    desktopLayout,
    positions: desktopLayout.shortcuts,
    changeWidgetSize,
    startWidgetDrag,
    moveWidgetDrag,
    finishWidgetDrag,
    handleWidgetKeyDown,
    cancelWidgetDrag,
  };
}

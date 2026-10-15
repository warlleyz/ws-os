import {
  useWidgetPreferences,
  getWidgetPreferenceError,
  saveWidgetPreferences,
  registerWidgetValidator,
} from '../../core/widgetPreferences';
import {
  getDesktopLayout,
  getCellLeft,
  getCellTop,
  getCellColumn,
  getCellRow,
  clampDesktopDrag,
} from '../../shells/desktop/desktopLayout';
import { useCallback, useEffect, useRef } from 'react';
import { useSystem } from '../../core/useSystem';
import { setWidgetVisibility, setWidgetPosition, setWidgetSize } from '../../core/widgetManager';

export default function useDesktopWidgets({ shortcuts, gridSize, shortcutPositions = {} }) {
  const { notify } = useSystem();
  const widgetState = useWidgetPreferences();
  const widgetDragRef = useRef(null);
  const saveWarningRef = useRef(false);
  function warnStorage() {
    if (saveWarningRef.current) return;
    saveWarningRef.current = true;
    notify({
      title: 'Preferências dos widgets',
      message:
        'Não foi possível ler ou salvar as preferências. Os widgets continuam disponíveis nesta sessão; alterações podem não permanecer após recarregar.',
      source: 'Widgets',
      type: 'warning',
    });
  }
  function setWidgetState(next) {
    if (!saveWidgetPreferences(next)) warnStorage();
    else saveWarningRef.current = false;
  }
  useEffect(() => {
    if (getWidgetPreferenceError() && !saveWarningRef.current) {
      saveWarningRef.current = true;
      notify({
        title: 'Preferências dos widgets',
        message:
          'Não foi possível ler ou salvar as preferências. Os widgets continuam disponíveis nesta sessão; alterações podem não permanecer após recarregar.',
        source: 'Widgets',
        type: 'warning',
      });
    }
  }, [notify]);
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
  useEffect(
    () =>
      registerWidgetValidator((candidate) =>
        Boolean(
          getDesktopLayout(
            shortcuts.length,
            gridSize.width,
            gridSize.height,
            candidate,
            shortcuts.map((app) => shortcutPositions[app.id]),
          ).widget,
        ),
      ),
    [shortcuts, gridSize.width, gridSize.height, shortcutPositions],
  );
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
    if (
      clockWidget.visible &&
      !getCandidateLayout({ ...clockWidget, size: { columns, rows } }).widget
    ) {
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
      Math.abs(layout.widget.left - getCellLeft(column, layout)) > 0.01 ||
      layout.widget.top !== getCellTop(row)
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
    [gridSize.width, gridSize.height, widgetState, cancelWidgetDrag],
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
      bounds: {
        left: desktopLayout.widget.left,
        top: desktopLayout.widget.top,
        right:
          desktopLayout.widget.left +
          element.offsetWidth,
        bottom:
          desktopLayout.widget.top +
          element.offsetHeight,
      },
      layout: desktopLayout,

    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveWidgetDrag(event) {
    const drag = widgetDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    const limited = clampDesktopDrag(
      event.clientX - drag.x,
      event.clientY - drag.y,
      drag.bounds,
      drag.layout,
    );

    drag.element.style.translate =
      `${limited.dx}px ${limited.dy}px`;

    const column = getCellColumn(
      drag.left + limited.dx,
      drag.layout,
    );

    const row = getCellRow(drag.top + limited.dy);

    const layout = getCandidateLayout({
      ...clockWidget,
      position: { column, row },
    });

    const valid = Boolean(
      layout.widget &&
      Math.abs(
        layout.widget.left - getCellLeft(column, layout),
      ) <= 0.01 &&
      layout.widget.top === getCellTop(row),
    );

    drag.element.setAttribute(
      'data-drop-valid',
      String(valid),
    );
  }


  function finishWidgetDrag(event) {
    if (widgetDragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    const drag = cancelWidgetDrag();

    if (!drag || event.type !== 'pointerup') return;

    const limited = clampDesktopDrag(
      event.clientX - drag.x,
      event.clientY - drag.y,
      drag.bounds,
      drag.layout,
    );

    placeWidget(
      getCellColumn(drag.left + limited.dx, drag.layout),
      getCellRow(drag.top + limited.dy),
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
      getCellColumn(desktopLayout.widget.left, desktopLayout) + dx,
      getCellRow(desktopLayout.widget.top) + dy,
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

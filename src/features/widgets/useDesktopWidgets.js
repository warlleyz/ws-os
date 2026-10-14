import { COLUMN_STEP, ROW_STEP, getDesktopLayout } from '../../shells/desktop/desktopLayout';
import { useEffect, useRef, useState } from 'react';
import {
  loadWidgetState,
  saveWidgetState,
  setWidgetVisibility,
  setWidgetPosition,
  setWidgetSize,
} from '../../core/widgetManager';
// Distribuição dos atalhos no Desktop.
export default function useDesktopWidgets({ shortcuts, gridSize }) {
  const [widgetState, setWidgetState] = useState(loadWidgetState);
  useEffect(() => {
    saveWidgetState(widgetState);
  }, [widgetState]);
  function toggleClockWidget() {
    setWidgetState((current) => {
      const clock = current.widgets.find((widget) => widget.instanceId === 'clock-default');
      if (!clock) return current;
      return setWidgetVisibility(current, clock.instanceId, !clock.visible);
    });
  }
  const widgetDragRef = useRef(null);
  const clockWidget = widgetState.widgets.find((widget) => widget.instanceId === 'clock-default');
  const desktopLayout = getDesktopLayout(
    shortcuts.length,
    gridSize.width,
    gridSize.height,
    clockWidget,
  );
  const positions = desktopLayout.shortcuts;
  function canPlaceWidget(candidate) {
    const layout = getDesktopLayout(shortcuts.length, gridSize.width, gridSize.height, candidate);
    return layout.widget !== null && layout.shortcuts.length === shortcuts.length;
  }
  function changeWidgetSize(value) {
    const [columns, rows] = value.split('x').map(Number);
    const candidate = {
      ...clockWidget,
      size: {
        columns,
        rows,
      },
    };
    if (!canPlaceWidget(candidate)) return;
    setWidgetState((current) =>
      setWidgetSize(current, 'clock-default', {
        columns,
        rows,
      }),
    );
  }
  function startWidgetDrag(event) {
    if (event.button !== 0 || !desktopLayout.widget) return;
    widgetDragRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: desktopLayout.widget.left,
      top: desktopLayout.widget.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveWidgetDrag(event) {
    const drag = widgetDragRef.current;
    if (!drag) return;
    const widgetElement = event.currentTarget.closest('.desktop__widget');
    if (!widgetElement) return;
    widgetElement.style.translate = `${event.clientX - drag.x}px ${event.clientY - drag.y}px`;
  }
  function finishWidgetDrag(event) {
    const drag = widgetDragRef.current;
    if (!drag) return;
    widgetDragRef.current = null;
    const widgetElement = event.currentTarget.closest('.desktop__widget');
    if (widgetElement) {
      widgetElement.style.translate = '';
    }
    if (event.type === 'pointercancel') return;
    const column = Math.round((drag.left + event.clientX - drag.x) / COLUMN_STEP);
    const row = Math.round((drag.top + event.clientY - drag.y) / ROW_STEP);
    if (column < 0 || row < 0) return;
    const candidate = {
      ...clockWidget,
      position: {
        column,
        row,
      },
    };
    if (!canPlaceWidget(candidate)) return;
    const layout = getDesktopLayout(shortcuts.length, gridSize.width, gridSize.height, candidate);
    if (layout.widget.left !== column * COLUMN_STEP || layout.widget.top !== row * ROW_STEP) {
      return;
    }
    setWidgetState((current) =>
      setWidgetPosition(current, 'clock-default', {
        column,
        row,
      }),
    );
  }
  return {
    widgetState,
    toggleClockWidget,
    clockWidget,
    desktopLayout,
    positions,
    changeWidgetSize,
    startWidgetDrag,
    moveWidgetDrag,
    finishWidgetDrag,
  };
}

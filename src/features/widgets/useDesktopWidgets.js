import {
  useWidgetPreferences,
  getWidgetPreferenceError,
  saveWidgetPreferences,
  registerWidgetValidator,
} from '../../core/widgetPreferences';
import {
  getMultiWidgetLayout,
  getCellLeft,
  getCellTop,
  getCellColumn,
  getCellRow,
  clampDesktopDrag,
} from '../../shells/desktop/desktopLayout';
import { useCallback, useEffect, useRef } from 'react';
import { useSystem } from '../../core/useSystem';
import {
  getWidgetDefinition,
  setWidgetVisibility,
  setWidgetPosition,
  setWidgetSize,
} from '../../core/widgetManager';


function getCompatibleWidgetLayout(
  count,
  width,
  height,
  clockWidget,
  preferred,
) {
  // Integração progressiva: o Relógio é o único
  // widget habilitado no renderizador nesta etapa.
  const widgets = clockWidget ? [clockWidget] : [];

  const layout = getMultiWidgetLayout(
    count,
    width,
    height,
    widgets,
    preferred,
  );

  const clockPlacement =
    layout.widgets['clock-default'] ?? null;

  return {
    ...layout,

    // Contratos temporários utilizados pelo
    // WidgetHost e pela movimentação atual.
    widget: clockPlacement
      ? {
        left: clockPlacement.left,
        top: clockPlacement.top,
      }
      : null,

    widgetSize: clockWidget?.size ?? null,

    widgetBlocked: Boolean(
      clockWidget?.visible && !clockPlacement,
    ),
  };
}


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
  const desktopLayout = getCompatibleWidgetLayout(
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
    return getCompatibleWidgetLayout(
      shortcuts.length,
      gridSize.width,
      gridSize.height,
      candidate,
      preferred,
    );
  }


  useEffect(
    () =>
      registerWidgetValidator((candidate) => {
        if (candidate.widgetId !== 'clock') {
          return false;
        }

        const layout = getCompatibleWidgetLayout(
          shortcuts.length,
          gridSize.width,
          gridSize.height,
          candidate,
          shortcuts.map(
            (app) => shortcutPositions[app.id],
          ),
        );

        return Boolean(layout.widget);
      }),
    [
      shortcuts,
      gridSize.width,
      gridSize.height,
      shortcutPositions,
    ],
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

  function changeWidgetSize(instanceId, value) {
    const widget = widgetState.widgets.find(
      (item) => item.instanceId === instanceId,
    );

    if (!widget) return;

    const definition = getWidgetDefinition(widget.widgetId);

    if (!definition?.allowedSizes?.includes(value)) {
      return;
    }

    const [columns, rows] = value.split('x').map(Number);

    // Enquanto o motor de layout ainda estiver conectado
    // somente ao relógio, outros widgets não poderão
    // ser redimensionados pela interface do Desktop.
    if (widget.widgetId !== 'clock') {
      return;
    }

    const candidate = {
      ...widget,
      size: { columns, rows },
    };

    const layout = getCandidateLayout(candidate);

    if (
      widget.visible &&
      !layout.widgets?.[instanceId]
    ) {
      blocked();
      return;
    }

    setWidgetState((current) =>
      setWidgetSize(
        current,
        instanceId,
        { columns, rows },
      ),
    );
  }


  function placeWidget(instanceId, column, row) {
    const widget = widgetState.widgets.find(
      (item) => item.instanceId === instanceId,
    );

    if (!widget || widget.widgetId !== 'clock') return;

    const candidate = {
      ...widget,
      position: { column, row },
    };

    const layout = getCandidateLayout(candidate);
    const placement = layout.widgets?.[instanceId];

    const valid = Boolean(
      placement &&
      placement.position.column === column &&
      placement.position.row === row,
    );

    if (!valid) {
      blocked();
      return;
    }

    setWidgetState((current) =>
      setWidgetPosition(current, instanceId, {
        column,
        row,
      }),
    );
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

  function startWidgetDrag(event, instanceId) {
    if (event.button !== 0 || widgetDragRef.current) return;

    const widget = widgetState.widgets.find(
      (item) => item.instanceId === instanceId,
    );

    const placement = desktopLayout.widgets?.[instanceId];

    if (
      !widget ||
      widget.widgetId !== 'clock' ||
      !placement
    ) {
      return;
    }

    const element = event.currentTarget.closest('.desktop__widget');

    if (!element) return;

    widgetDragRef.current = {
      instanceId,
      pointerId: event.pointerId,
      target: event.currentTarget,
      element,
      x: event.clientX,
      y: event.clientY,
      left: placement.left,
      top: placement.top,
      bounds: {
        left: placement.left,
        top: placement.top,
        right: placement.left + element.offsetWidth,
        bottom: placement.top + element.offsetHeight,
      },
      layout: desktopLayout,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }



  function moveWidgetDrag(event) {
    const drag = widgetDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const widget = widgetState.widgets.find(
      (item) => item.instanceId === drag.instanceId,
    );

    if (!widget) {
      cancelWidgetDrag();
      return;
    }

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

    const row = getCellRow(
      drag.top + limited.dy,
    );

    const layout = getCandidateLayout({
      ...widget,
      position: { column, row },
    });

    const placement = layout.widgets?.[drag.instanceId];

    const valid = Boolean(
      placement &&
      placement.position.column === column &&
      placement.position.row === row,
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

    const column = getCellColumn(
      drag.left + limited.dx,
      drag.layout,
    );

    const row = getCellRow(
      drag.top + limited.dy,
    );

    placeWidget(drag.instanceId, column, row);
  }



  function handleWidgetKeyDown(event, instanceId) {
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

    if (!directions[event.key]) return;

    const placement = desktopLayout.widgets?.[instanceId];

    if (!placement) return;

    event.preventDefault();

    const [dx, dy] = directions[event.key];

    const column = getCellColumn(
      placement.left,
      desktopLayout,
    ) + dx;

    const row = getCellRow(placement.top) + dy;

    placeWidget(instanceId, column, row);
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

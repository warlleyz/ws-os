
import { useCallback, useEffect, useRef } from 'react';

import {
  useWidgetPreferences,
  getWidgetPreferenceError,
  publishWidgetPreferences,
  registerWidgetValidator,
} from '../../core/widgetPreferences';

import {
  getMultiWidgetLayout,
  getCellColumn,
  getCellRow,
  clampDesktopDrag,
} from '../../shells/desktop/desktopLayout';

import {
  initialWidgetState,
  getWidgetDefinition,
  setWidgetVisibility,
  setWidgetPosition,
  setWidgetSize,
} from '../../core/widgetManager';

import { useSystem } from '../../core/useSystem';

// Todos os widgets previstos no planejamento.
export const DESKTOP_WIDGET_IDS = [
  'clock',
  'calendar',
  'weather',
  'dev-insights',
];

// Habilitar cada componente depois de implementado.
// O cadastro e as preferências dos seis já existem.
const READY_WIDGET_IDS = new Set([
  'clock',
  'calendar',
  'weather',
  'dev-insights',
]);

function getCompatibleWidgetLayout(
  count,
  width,
  height,
  widgets,
  preferred,
) {
  const enabledWidgets = widgets.filter(
    (widget) => READY_WIDGET_IDS.has(widget.widgetId),
  );

  const layout = getMultiWidgetLayout(
    count,
    width,
    height,
    enabledWidgets,
    preferred,
  );

  // Compatibilidade temporária com componentes antigos.
  const clock = widgets.find(
    (widget) => widget.instanceId === 'clock-default',
  );

  const clockPlacement =
    layout.widgets?.['clock-default'] ?? null;

  return {
    ...layout,

    widget: clockPlacement
      ? {
        left: clockPlacement.left,
        top: clockPlacement.top,
      }
      : null,

    widgetSize: clock?.size ?? null,

    widgetBlocked: Boolean(
      clock?.visible && !clockPlacement,
    ),
  };
}

export default function useDesktopWidgets({
  shortcuts,
  gridSize,
  shortcutPositions = {},
  commitWidgetLayout,
}) {
  const { notify } = useSystem();

  const widgetState = useWidgetPreferences();

  const widgetDragRef = useRef(null);
  const storageWarningRef = useRef(false);

  const widgets = widgetState.widgets;

  const clockWidget = widgets.find(
    (widget) => widget.instanceId === 'clock-default',
  );

  const preferred = shortcuts.map(
    (app) => shortcutPositions[app.id],
  );

  const desktopLayout = getCompatibleWidgetLayout(
    shortcuts.length,
    gridSize.width,
    gridSize.height,
    widgets,
    preferred,
  );

  // --------------------------------------------------
  // Consultas e validações
  // --------------------------------------------------

  function getWidget(instanceId) {
    return widgets.find(
      (widget) => widget.instanceId === instanceId,
    ) ?? null;
  }

  function isWidgetReady(widgetId) {
    return READY_WIDGET_IDS.has(widgetId);
  }

  function getCandidateState(instanceId, patch) {
    return {
      ...widgetState,
      widgets: widgets.map((widget) =>
        widget.instanceId === instanceId
          ? { ...widget, ...patch }
          : widget,
      ),
    };
  }

  function getCandidateLayout(nextState) {
    return getCompatibleWidgetLayout(
      shortcuts.length,
      gridSize.width,
      gridSize.height,
      nextState.widgets,
      preferred,
    );
  }

  function isPlacementExact(
    layout,
    instanceId,
    position,
  ) {
    const placement = layout.widgets?.[instanceId];

    return Boolean(
      placement &&
      placement.position.column === position.column &&
      placement.position.row === position.row,
    );
  }

  // --------------------------------------------------
  // Notificações
  // --------------------------------------------------

  function warnBlocked() {
    notify({
      title: 'Posição indisponível',
      message:
        'Não há espaço disponível para essa organização. Os atalhos e as áreas reservadas foram preservados.',
      source: 'Widgets',
      type: 'warning',
    });
  }

  function warnStorage() {
    if (storageWarningRef.current) return;

    storageWarningRef.current = true;

    notify({
      title: 'Preferências dos widgets',
      message:
        'Não foi possível recuperar corretamente as preferências dos widgets.',
      source: 'Widgets',
      type: 'warning',
    });
  }

  useEffect(() => {
    if (getWidgetPreferenceError()) {
      warnStorage();
    }
    // A verificação é necessária somente na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------
  // Validador utilizado pelo aplicativo Configurações
  // --------------------------------------------------

  useEffect(() => {
    return registerWidgetValidator((candidate) => {
      if (!isWidgetReady(candidate.widgetId)) {
        return false;
      }

      const nextState = {
        ...widgetState,
        widgets: widgetState.widgets.map((widget) =>
          widget.instanceId === candidate.instanceId
            ? candidate
            : widget,
        ),
      };

      const layout = getCompatibleWidgetLayout(
        shortcuts.length,
        gridSize.width,
        gridSize.height,
        nextState.widgets,
        shortcuts.map(
          (app) => shortcutPositions[app.id],
        ),
      );

      return (
        !candidate.visible ||
        Boolean(layout.widgets?.[candidate.instanceId])
      );
    });
  }, [
    widgetState,
    shortcuts,
    gridSize.width,
    gridSize.height,
    shortcutPositions,
  ]);

  // --------------------------------------------------
  // Persistência coordenada
  // --------------------------------------------------

  function confirmWidgetChange(nextState, layout) {
    if (typeof commitWidgetLayout !== 'function') {
      notify({
        title: 'Organização indisponível',
        message:
          'O gerenciador de persistência do Desktop não está conectado.',
        source: 'Widgets',
        type: 'warning',
      });

      return false;
    }

    if (!commitWidgetLayout(nextState, layout)) {
      return false;
    }

    return publishWidgetPreferences(nextState);
  }

  // --------------------------------------------------
  // Visibilidade
  // --------------------------------------------------

  function toggleWidget(instanceId) {
    const widget = getWidget(instanceId);

    if (!widget || !isWidgetReady(widget.widgetId)) {
      return false;
    }

    const visible = !widget.visible;

    const nextState = setWidgetVisibility(
      widgetState,
      instanceId,
      visible,
    );

    const layout = getCandidateLayout(nextState);

    if (
      visible &&
      !layout.widgets?.[instanceId]
    ) {
      warnBlocked();
      return false;
    }

    return confirmWidgetChange(nextState, layout);
  }

  // Compatibilidade com o Desktop atual.
  function toggleClockWidget() {
    return toggleWidget('clock-default');
  }


  function resetWidget(instanceId) {
    const widget = getWidget(instanceId);

    const defaults = initialWidgetState.widgets.find(
      (item) => item.instanceId === instanceId,
    );

    if (!widget || !defaults) {
      return false;
    }

    // Restaura as preferências do widget sem
    // modificar as configurações dos demais.
    const nextState = {
      ...widgetState,
      widgets: widgetState.widgets.map((item) =>
        item.instanceId === instanceId
          ? {
            ...item,
            size: { ...defaults.size },
            settings: { ...defaults.settings },
            position: null,
          }
          : item,
      ),
    };

    const layout = getCandidateLayout(nextState);

    // A restauração não pode remover atalhos ou
    // salvar uma organização inválida.
    if (
      widget.visible &&
      !layout.widgets?.[instanceId]
    ) {
      warnBlocked();
      return false;
    }

    return confirmWidgetChange(nextState, layout);
  }

  // --------------------------------------------------
  // Redimensionamento
  // --------------------------------------------------

  function changeWidgetSize(instanceId, value) {
    const widget = getWidget(instanceId);

    if (!widget || !isWidgetReady(widget.widgetId)) {
      return false;
    }

    const definition = getWidgetDefinition(
      widget.widgetId,
    );

    if (!definition?.allowedSizes?.includes(value)) {
      return false;
    }

    const [columns, rows] = value
      .split('x')
      .map(Number);

    const nextState = setWidgetSize(
      widgetState,
      instanceId,
      { columns, rows },
    );

    const layout = getCandidateLayout(nextState);

    if (
      widget.visible &&
      !layout.widgets?.[instanceId]
    ) {
      warnBlocked();
      return false;
    }

    return confirmWidgetChange(nextState, layout);
  }

  // --------------------------------------------------
  // Posicionamento
  // --------------------------------------------------

  function placeWidget(instanceId, column, row) {
    const widget = getWidget(instanceId);

    if (
      !widget ||
      !widget.visible ||
      !isWidgetReady(widget.widgetId)
    ) {
      return false;
    }

    const position = { column, row };

    const nextState = setWidgetPosition(
      widgetState,
      instanceId,
      position,
    );

    const layout = getCandidateLayout(nextState);

    if (!isPlacementExact(layout, instanceId, position)) {
      warnBlocked();
      return false;
    }

    return confirmWidgetChange(nextState, layout);
  }

  // --------------------------------------------------
  // Cancelamento do arraste
  // --------------------------------------------------

  const cancelWidgetDrag = useCallback(() => {
    const drag = widgetDragRef.current;

    widgetDragRef.current = null;

    if (!drag) return null;

    if (drag.element) {
      drag.element.style.translate = '';
      drag.element.removeAttribute('data-drop-valid');
    }

    if (
      drag.target?.hasPointerCapture?.(drag.pointerId)
    ) {
      drag.target.releasePointerCapture(
        drag.pointerId,
      );
    }

    return drag;
  }, []);

  useEffect(
    () => () => {
      cancelWidgetDrag();
    },
    [
      gridSize.width,
      gridSize.height,
      widgetState,
      cancelWidgetDrag,
    ],
  );

  // --------------------------------------------------
  // Arraste: início
  // --------------------------------------------------

  function startWidgetDrag(event, instanceId) {
    if (
      event.button !== 0 ||
      widgetDragRef.current
    ) {
      return;
    }

    const widget = getWidget(instanceId);
    const placement =
      desktopLayout.widgets?.[instanceId];

    if (
      !widget ||
      !widget.visible ||
      !isWidgetReady(widget.widgetId) ||
      !placement
    ) {
      return;
    }

    const element = event.currentTarget.closest(
      '.desktop__widget',
    );

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

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );
  }

  // --------------------------------------------------
  // Arraste: movimentação
  // --------------------------------------------------

  function moveWidgetDrag(event) {
    const drag = widgetDragRef.current;

    if (
      !drag ||
      drag.pointerId !== event.pointerId
    ) {
      return;
    }

    const widget = getWidget(drag.instanceId);

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

    const nextState = getCandidateState(
      drag.instanceId,
      {
        position: { column, row },
      },
    );

    const layout = getCandidateLayout(nextState);

    const valid = isPlacementExact(
      layout,
      drag.instanceId,
      { column, row },
    );

    drag.element.setAttribute(
      'data-drop-valid',
      String(valid),
    );
  }

  // --------------------------------------------------
  // Arraste: finalização
  // --------------------------------------------------

  function finishWidgetDrag(event) {
    if (
      widgetDragRef.current?.pointerId !==
      event.pointerId
    ) {
      return;
    }

    const drag = cancelWidgetDrag();

    if (
      !drag ||
      event.type !== 'pointerup'
    ) {
      return;
    }

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

    placeWidget(
      drag.instanceId,
      column,
      row,
    );
  }

  // --------------------------------------------------
  // Movimentação pelo teclado
  // --------------------------------------------------

  function handleWidgetKeyDown(
    event,
    instanceId,
  ) {
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

    if (!directions[event.key]) {
      return;
    }

    const placement =
      desktopLayout.widgets?.[instanceId];

    if (!placement) return;

    event.preventDefault();

    const [dx, dy] = directions[event.key];

    const column =
      placement.position.column + dx;

    const row =
      placement.position.row + dy;

    placeWidget(instanceId, column, row);
  }

  // --------------------------------------------------
  // Interface pública
  // --------------------------------------------------

  return {
    widgetState,
    widgets,
    clockWidget,
    desktopLayout,
    positions: desktopLayout.shortcuts,

    toggleWidget,
    toggleClockWidget,
    changeWidgetSize,
    placeWidget,

    startWidgetDrag,
    moveWidgetDrag,
    finishWidgetDrag,
    handleWidgetKeyDown,
    cancelWidgetDrag,
    resetWidget,
  };
}

const WIDGETS_STORAGE_KEY = 'ws-os:desktop-widgets';

const widgetDefinitions = [
  {
    id: 'clock',
    name: 'Relógio',
    description: 'Exibe a data e a hora atuais.',
    defaultSize: { columns: 2, rows: 2 },
  },
];

export const initialWidgetState = {
  widgets: [
    {
      instanceId: 'clock-default',
      widgetId: 'clock',
      visible: true,
      position: null,
      size: { columns: 2, rows: 2 },
    },
  ],
};

export function getWidgetDefinition(widgetId) {
  return widgetDefinitions.find((widget) => widget.id === widgetId) ?? null;
}

export function getRegisteredWidgets() {
  return [...widgetDefinitions];
}

function validSize(size, fallback) {
  if (
    !size ||
    !Number.isInteger(size.columns) ||
    !Number.isInteger(size.rows) ||
    size.columns < 1 ||
    size.rows < 1 ||
    size.columns > 6 ||
    size.rows > 6
  ) {
    return fallback;
  }

  return {
    columns: size.columns,
    rows: size.rows,
  };
}

function validPosition(position) {
  if (
    !position ||
    !Number.isInteger(position.column) ||
    !Number.isInteger(position.row) ||
    position.column < 0 ||
    position.row < 0
  ) {
    return null;
  }

  return {
    column: position.column,
    row: position.row,
  };
}

export function loadWidgetState() {
  try {
    const saved = localStorage.getItem(WIDGETS_STORAGE_KEY);

    if (!saved) return initialWidgetState;

    const parsed = JSON.parse(saved);

    if (!parsed || !Array.isArray(parsed.widgets)) {
      return initialWidgetState;
    }

    return {
      widgets: initialWidgetState.widgets.map((defaultWidget) => {
        const savedWidget = parsed.widgets.find(
          (item) =>
            item?.instanceId === defaultWidget.instanceId &&
            item?.widgetId === defaultWidget.widgetId,
        );

        if (!savedWidget) return defaultWidget;

        return {
          ...defaultWidget,
          visible:
            typeof savedWidget.visible === 'boolean' ? savedWidget.visible : defaultWidget.visible,
          position: validPosition(savedWidget.position),
          size: validSize(savedWidget.size, defaultWidget.size),
        };
      }),
    };
  } catch {
    return initialWidgetState;
  }
}

export function saveWidgetState(state) {
  try {
    localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(state));

    return true;
  } catch {
    return false;
  }
}

export function setWidgetVisibility(state, instanceId, visible) {
  return {
    ...state,
    widgets: state.widgets.map((widget) =>
      widget.instanceId === instanceId ? { ...widget, visible: Boolean(visible) } : widget,
    ),
  };
}

export function setWidgetPosition(state, instanceId, position) {
  return {
    ...state,
    widgets: state.widgets.map((widget) =>
      widget.instanceId === instanceId
        ? {
            ...widget,
            position: validPosition(position),
          }
        : widget,
    ),
  };
}

export function setWidgetSize(state, instanceId, size) {
  return {
    ...state,
    widgets: state.widgets.map((widget) =>
      widget.instanceId === instanceId
        ? {
            ...widget,
            size: validSize(size, widget.size),
          }
        : widget,
    ),
  };
}

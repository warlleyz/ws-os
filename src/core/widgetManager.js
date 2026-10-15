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
    !['2x2', '3x2', '3x3'].includes(`${size.columns}x${size.rows}`)
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

export function loadWidgetPreferences() {
  try {
    const saved = localStorage.getItem(WIDGETS_STORAGE_KEY);

    if (!saved) return { state: initialWidgetState, error: null };

    const parsed = JSON.parse(saved);

    if (!parsed || !Array.isArray(parsed.widgets)) {
      return { state: initialWidgetState, error: 'invalid' };
    }

    let invalid = parsed.widgets.length !== initialWidgetState.widgets.length;
    return {
      state: {
        widgets: initialWidgetState.widgets.map((defaultWidget) => {
          const savedWidget = parsed.widgets.find(
            (item) =>
              item?.instanceId === defaultWidget.instanceId &&
              item?.widgetId === defaultWidget.widgetId,
          );

          if (!savedWidget) {
            invalid = true;
            return defaultWidget;
          }
          const position = validPosition(savedWidget.position);
          const size = validSize(savedWidget.size, defaultWidget.size);
          if (
            typeof savedWidget.visible !== 'boolean' ||
            (savedWidget.position !== null && !position) ||
            size === defaultWidget.size
          )
            invalid = true;

          return {
            ...defaultWidget,
            visible:
              typeof savedWidget.visible === 'boolean'
                ? savedWidget.visible
                : defaultWidget.visible,
            position,
            size,
          };
        }),
      },
      error: invalid ? 'invalid' : null,
    };
  } catch {
    return { state: initialWidgetState, error: 'unavailable' };
  }
}

export function loadWidgetState() {
  return loadWidgetPreferences().state;
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

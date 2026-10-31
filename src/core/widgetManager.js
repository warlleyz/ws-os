/* === CONFIGURAÇÃO DOS WIDGETS === */
const WIDGETS_STORAGE_KEY = 'ws-os:desktop-widgets';

/* === CATÁLOGO DE WIDGETS === */
const widgetDefinitions = [
  {
    id: 'clock',
    name: 'Relógio',
    description: 'Exibe a data e a hora atuais.',
    defaultSize: { columns: 2, rows: 2 },
    allowedSizes: ['2x1', '2x2', '3x2', '3x3'],
    defaultVisible: false,
  },
  {
    id: 'calendar',
    name: 'Calendário',
    description: 'Exibe datas, feriados e eventos públicos.',
    defaultSize: { columns: 3, rows: 3 },
    allowedSizes: ['3x3', '4x3', '4x4'],
    defaultVisible: false,
  },
  {
    id: 'weather',
    name: 'Clima',
    description: 'Exibe as condições meteorológicas e a previsão.',
    defaultSize: { columns: 3, rows: 2 },
    allowedSizes: ['2x2', '3x2', '4x3'],
    defaultVisible: false,
  },
  {
    id: 'dev-insights',
    name: 'Dev Insights',
    description: 'Apresenta estatísticas da atividade de desenvolvimento.',
    defaultSize: { columns: 3, rows: 2 },
    allowedSizes: ['2x2', '3x2', '4x3'],
    defaultVisible: false,
  },
];

/* === ESTADO INICIAL === */
export const initialWidgetState = {
  widgets: widgetDefinitions.map((definition) => ({
    instanceId: `${definition.id}-default`,
    widgetId: definition.id,
    visible: definition.defaultVisible,
    position: null,
    size: { ...definition.defaultSize },
    settings: {},
  })),
};

/* === CONSULTAS AO CATÁLOGO === */
/* ----- DEFINIÇÃO DO WIDGET ----- */
export function getWidgetDefinition(widgetId) {
  return widgetDefinitions.find((widget) => widget.id === widgetId) ?? null;
}

/* ----- LISTA DE WIDGETS ----- */
export function getRegisteredWidgets() {
  return [...widgetDefinitions];
}

/* === VALIDAÇÃO DE GEOMETRIA === */
/* ----- TAMANHO ----- */
function validSize(size, fallback, allowedSizes) {
  if (
    !size ||
    !Number.isInteger(size.columns) ||
    !Number.isInteger(size.rows) ||
    size.columns < 1 ||
    size.rows < 1
  ) {
    return { ...fallback };
  }

  const sizeKey = `${size.columns}x${size.rows}`;

  if (!allowedSizes.includes(sizeKey)) {
    return { ...fallback };
  }

  return {
    columns: size.columns,
    rows: size.rows,
  };
}

/* ----- POSIÇÃO ----- */
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

/* === PERSISTÊNCIA DE WIDGETS === */
/* ----- CARREGAMENTO DE PREFERÊNCIAS ----- */
export function loadWidgetPreferences() {
  try {
    const saved = localStorage.getItem(WIDGETS_STORAGE_KEY);

    if (!saved) {
      return {
        state: initialWidgetState,
        error: null,
      };
    }

    const parsed = JSON.parse(saved);

    if (!parsed || !Array.isArray(parsed.widgets)) {
      return {
        state: initialWidgetState,
        error: 'invalid',
      };
    }

    let invalid = false;

    const widgets = widgetDefinitions.map((definition) => {
      const defaults = initialWidgetState.widgets.find(
        (widget) => widget.widgetId === definition.id,
      );

      const stored = parsed.widgets.find(
        (widget) =>
          widget?.instanceId === defaults.instanceId && widget?.widgetId === definition.id,
      );

      /* ----- RECUPERAÇÃO DOS PADRÕES ----- */
      if (!stored) {
        return {
          ...defaults,
          size: { ...defaults.size },
          settings: {},
        };
      }

      /* ----- VALIDAÇÃO DOS DADOS ARMAZENADOS ----- */
      const size = validSize(stored.size, defaults.size, definition.allowedSizes);
      const position = validPosition(stored.position);
      const validVisible = typeof stored.visible === 'boolean';
      const validSettings =
        stored.settings !== null &&
        typeof stored.settings === 'object' &&
        !Array.isArray(stored.settings);

      if (
        !validVisible ||
        (stored.position != null && position === null) ||
        !(stored.size?.columns === size.columns && stored.size?.rows === size.rows) ||
        (stored.settings !== undefined && !validSettings)
      ) {
        invalid = true;
      }

      return {
        ...defaults,
        visible: validVisible ? stored.visible : defaults.visible,
        position,
        size,
        settings: validSettings ? { ...stored.settings } : {},
      };
    });

    return {
      state: { widgets },
      error: invalid ? 'invalid' : null,
    };
  } catch {
    return {
      state: initialWidgetState,
      error: 'unavailable',
    };
  }
}

/* ----- CONSULTA DO ESTADO ARMAZENADO ----- */
export function loadWidgetState() {
  return loadWidgetPreferences().state;
}

/* ----- SALVAMENTO ----- */
export function saveWidgetState(state) {
  try {
    localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/* === GERENCIAMENTO DE WIDGETS === */
/* ----- VISIBILIDADE ----- */
export function setWidgetVisibility(state, instanceId, visible) {
  return {
    ...state,
    widgets: state.widgets.map((widget) =>
      widget.instanceId === instanceId ? { ...widget, visible: Boolean(visible) } : widget,
    ),
  };
}

/* ----- POSIÇÃO ----- */
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

/* ----- TAMANHO ----- */
export function setWidgetSize(state, instanceId, size) {
  return {
    ...state,
    widgets: state.widgets.map((widget) => {
      if (widget.instanceId !== instanceId) {
        return widget;
      }

      const definition = getWidgetDefinition(widget.widgetId);

      if (!definition) {
        return widget;
      }

      return {
        ...widget,
        size: validSize(size, widget.size, definition.allowedSizes),
      };
    }),
  };
}
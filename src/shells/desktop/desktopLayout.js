/* === Constantes da grade === */
export const COLUMN_STEP = 90;
export const ROW_STEP = 88;
export const SHORTCUT_WIDTH = 82;
export const MIN_COLUMN_STEP = 82;
export const TASKBAR_RESERVED_WIDTH = 480;
export const TASKBAR_RESERVED_BOTTOM = 64;

/* === Utilitários de coordenadas === */
/* ----- Identificação de células ----- */
const key = (column, row) => `${column}:${row}`;

/* ----- Dimensões da grade ----- */
export function getColumnStep(layout) {
  return layout.columnStep ?? COLUMN_STEP;
}

export function getCellLeft(column, layout) {
  return column * getColumnStep(layout);
}

export function getCellTop(row) {
  return row * ROW_STEP;
}

export function getCellColumn(left, layout) {
  return Math.round(left / getColumnStep(layout));
}

export function getCellRow(top) {
  return Math.round(top / ROW_STEP);
}

export function getWidgetWidth(columns, layout) {
  return (columns - 1) * getColumnStep(layout) + SHORTCUT_WIDTH;
}

/* === Restrições da grade === */
/* ----- Limites de arraste ----- */
export function clampDesktopDrag(dx, dy, bounds, layout) {
  const minDx = -bounds.left;
  const maxDx = Math.max(minDx, layout.width - bounds.right);
  const minDy = -bounds.top;
  const maxDy = Math.max(minDy, layout.height - bounds.bottom);

  return {
    dx: Math.max(minDx, Math.min(dx, maxDx)),
    dy: Math.max(minDy, Math.min(dy, maxDy)),
  };
}

/* ----- Disponibilidade das células ----- */
export function isDesktopCellAvailable(column, row, layout) {
  if (
    !Number.isInteger(column) ||
    !Number.isInteger(row) ||
    column < 0 ||
    row < 0 ||
    column >= layout.columns ||
    row >= layout.rows
  ) {
    return false;
  }

  const left = getCellLeft(column, layout);
  const top = getCellTop(row);

  const isBottomArea =
    top < layout.viewportHeight &&
    top + ROW_STEP > layout.viewportHeight - TASKBAR_RESERVED_BOTTOM;

  if (!isBottomArea) {
    return true;
  }

  const reservedWidth = Math.min(TASKBAR_RESERVED_WIDTH, layout.width);
  const reservedLeft = (layout.width - reservedWidth) / 2;

  return left + SHORTCUT_WIDTH <= reservedLeft;
}

/* === Ocupação dos widgets === */
/* ----- Células ocupadas ----- */
export function getWidgetCells(position, size) {
  if (
    !position ||
    !size ||
    !Number.isInteger(position.column) ||
    !Number.isInteger(position.row) ||
    !Number.isInteger(size.columns) ||
    !Number.isInteger(size.rows) ||
    position.column < 0 ||
    position.row < 0 ||
    size.columns < 1 ||
    size.rows < 1
  ) {
    return [];
  }

  const cells = [];

  for (let column = 0; column < size.columns; column += 1) {
    for (let row = 0; row < size.rows; row += 1) {
      cells.push({
        column: position.column + column,
        row: position.row + row,
      });
    }
  }

  return cells;
}

/* ----- Verificação de disponibilidade ----- */
export function canPlaceWidget(position, size, layout, occupied = new Set()) {
  const cells = getWidgetCells(position, size);

  if (cells.length === 0 || cells.length !== size.columns * size.rows) {
    return false;
  }

  return cells.every(
    ({ column, row }) =>
      isDesktopCellAvailable(column, row, layout) &&
      !occupied.has(`${column}:${row}`),
  );
}

/* ----- Registro de ocupação ----- */
export function occupyWidgetCells(occupied, position, size) {
  const next = new Set(occupied);

  for (const { column, row } of getWidgetCells(position, size)) {
    next.add(`${column}:${row}`);
  }

  return next;
}

/* === Posicionamento dos widgets === */
/* ----- Candidatos de posicionamento ----- */
function* widgetCandidates(size, layout, preferred, rightFirst = false) {
  const maxColumn = layout.columns - size.columns;
  const maxRow = layout.rows - size.rows;

  if (maxColumn < 0 || maxRow < 0) return;

  const hasPreferred =
    Number.isInteger(preferred?.column) &&
    Number.isInteger(preferred?.row);

  /* ----- Preferência dentro da grade ----- */
  if (
    hasPreferred &&
    preferred.column >= 0 &&
    preferred.column <= maxColumn &&
    preferred.row >= 0 &&
    preferred.row <= maxRow
  ) {
    const { column, row } = preferred;

    const distanceLimit =
      Math.max(column, maxColumn - column) +
      Math.max(row, maxRow - row);

    for (let distance = 0; distance <= distanceLimit; distance += 1) {
      for (
        let x = Math.max(0, column - distance);
        x <= Math.min(maxColumn, column + distance);
        x += 1
      ) {
        const dy = distance - Math.abs(x - column);
        const low = row - dy;
        const high = row + dy;

        if (low >= 0 && low <= maxRow) {
          yield { column: x, row: low };
        }

        if (high !== low && high >= 0 && high <= maxRow) {
          yield { column: x, row: high };
        }
      }
    }

    return;
  }

  /* ----- Preferência fora da grade ----- */
  if (hasPreferred) {
    const positions = [];

    for (let column = 0; column <= maxColumn; column += 1) {
      for (let row = 0; row <= maxRow; row += 1) {
        positions.push({ column, row });
      }
    }

    positions.sort(
      (a, b) =>
        Math.abs(a.column - preferred.column) +
        Math.abs(a.row - preferred.row) -
        (Math.abs(b.column - preferred.column) +
          Math.abs(b.row - preferred.row)) ||
        a.column - b.column ||
        a.row - b.row,
    );

    yield* positions;
    return;
  }

  /* ----- Distribuição automática ----- */
  for (let i = 0; i <= maxColumn; i += 1) {
    const column = rightFirst ? maxColumn - i : i;

    for (let row = 0; row <= maxRow; row += 1) {
      yield { column, row };
    }
  }
}

/* ----- Localização de posição válida ----- */
export function findWidgetPosition(
  size,
  layout,
  occupied = new Set(),
  preferred = null,
) {
  for (const position of widgetCandidates(size, layout, preferred)) {
    if (canPlaceWidget(position, size, layout, occupied)) {
      return position;
    }
  }

  return null;
}

/* === Layout principal do Desktop === */
/* ----- Construção da grade ----- */
export function getDesktopLayout(count, width, height, widget, preferred = []) {
  if (width <= 0 || height <= 0) {
    return {
      shortcuts: [],
      widget: null,
      width: 0,
      height: 0,
      viewportHeight: 0,
      columns: 0,
      rows: 0,
      columnStep: COLUMN_STEP,
      overflow: false,
      widgetBlocked: Boolean(widget?.visible),
    };
  }

  const columns = Math.max(
    1,
    Math.floor((width - SHORTCUT_WIDTH) / MIN_COLUMN_STEP) + 1,
  );

  const columnStep =
    columns > 1
      ? (width - SHORTCUT_WIDTH) / (columns - 1)
      : COLUMN_STEP;

  const layout = {
    width,
    height,
    viewportHeight: height,
    columns,
    rows: Math.floor(height / ROW_STEP),
    columnStep,
    shortcuts: [],
    widget: null,
    widgetSize: widget?.size,
    overflow: false,
  };

  /* ----- Células disponíveis ----- */
  function cells() {
    const result = [];

    for (let column = 0; column < layout.columns; column += 1) {
      for (let row = 0; row < layout.rows; row += 1) {
        if (isDesktopCellAvailable(column, row, layout)) {
          result.push({ column, row });
        }
      }
    }

    return result;
  }

  let available = cells();
  const occupied = new Set();

  const widgetColumns = widget?.size?.columns ?? 2;
  const widgetRows = widget?.size?.rows ?? 2;

  /* ----- Verificação do widget inicial ----- */
  function fits(column, row) {
    for (let x = column; x < column + widgetColumns; x += 1) {
      for (let y = row; y < row + widgetRows; y += 1) {
        if (!isDesktopCellAvailable(x, y, layout)) {
          return false;
        }
      }
    }

    return true;
  }

  /* ----- Posicionamento do widget inicial ----- */
  if (
    widget?.visible &&
    Number.isInteger(widgetColumns) &&
    Number.isInteger(widgetRows) &&
    widgetColumns > 0 &&
    widgetRows > 0 &&
    available.length >= count + widgetColumns * widgetRows
  ) {
    let chosen = null;

    if (
      Number.isInteger(widget.position?.column) &&
      Number.isInteger(widget.position?.row) &&
      fits(widget.position.column, widget.position.row)
    ) {
      chosen = widget.position;
    }

    for (
      let column = layout.columns - widgetColumns;
      column >= 0 && !chosen;
      column -= 1
    ) {
      for (let row = 0; row < layout.rows; row += 1) {
        if (fits(column, row)) {
          chosen = { column, row };
          break;
        }
      }
    }

    if (chosen) {
      layout.widget = {
        left: getCellLeft(chosen.column, layout),
        top: getCellTop(chosen.row),
      };

      for (let x = chosen.column; x < chosen.column + widgetColumns; x += 1) {
        for (let y = chosen.row; y < chosen.row + widgetRows; y += 1) {
          occupied.add(key(x, y));
        }
      }
    }
  }

  layout.widgetBlocked = Boolean(widget?.visible && !layout.widget);

  /* ----- Expansão em caso de espaço insuficiente ----- */
  if (available.length < count) {
    layout.overflow = true;

    layout.rows = Math.max(
      layout.rows,
      Math.ceil(height / ROW_STEP) +
      Math.ceil(count / layout.columns) +
      1,
    );

    layout.height = layout.rows * ROW_STEP;
    available = cells();
  }

  /* ----- Recuperação das posições salvas ----- */
  const result = Array.from({ length: count }, () => null);

  for (let index = 0; index < count; index += 1) {
    const position = preferred[index];

    if (
      position &&
      isDesktopCellAvailable(position.column, position.row, layout) &&
      !occupied.has(key(position.column, position.row))
    ) {
      result[index] = {
        left: getCellLeft(position.column, layout),
        top: getCellTop(position.row),
      };

      occupied.add(key(position.column, position.row));
    }
  }

  /* ----- Distribuição dos atalhos restantes ----- */
  let nextCell = 0;

  for (let index = 0; index < count; index += 1) {
    if (result[index]) continue;

    while (
      nextCell < available.length &&
      occupied.has(
        key(available[nextCell].column, available[nextCell].row),
      )
    ) {
      nextCell += 1;
    }

    const cell = available[nextCell++];

    if (!cell) break;

    result[index] = {
      left: getCellLeft(cell.column, layout),
      top: getCellTop(cell.row),
    };

    occupied.add(key(cell.column, cell.row));
  }

  layout.shortcuts = result;

  return layout;
}

/* === Layout com múltiplos widgets === */
/* ----- Distribuição compartilhada ----- */
export function getMultiWidgetLayout(
  count,
  width,
  height,
  widgets = [],
  preferred = [],
) {
  const base = getDesktopLayout(count, width, height, null, preferred);

  const placements = {};
  const blockedWidgets = [];
  const widgetOccupied = new Set();

  const originalShortcuts = base.shortcuts.map((point) =>
    point
      ? {
        column: getCellColumn(point.left, base),
        row: getCellRow(point.top),
      }
      : null,
  );

  /* ----- Distribuição dos atalhos ----- */
  function placeShortcuts(reserved) {
    const occupied = new Set(reserved);
    const result = Array(count).fill(null);

    /* ----- Verificação de posição ----- */
    function available(position) {
      return (
        position &&
        isDesktopCellAvailable(position.column, position.row, base) &&
        !occupied.has(key(position.column, position.row))
      );
    }

    /* ----- Atribuição de posição ----- */
    function assign(index, position) {
      result[index] = {
        left: getCellLeft(position.column, base),
        top: getCellTop(position.row),
      };

      occupied.add(key(position.column, position.row));
    }

    /* ----- Posições escolhidas pelo usuário ----- */
    for (let index = 0; index < count; index += 1) {
      if (available(preferred[index])) {
        assign(index, preferred[index]);
      }
    }

    /* ----- Posições previamente calculadas ----- */
    for (let index = 0; index < count; index += 1) {
      if (!result[index] && available(originalShortcuts[index])) {
        assign(index, originalShortcuts[index]);
      }
    }

    /* ----- Realocação dos atalhos afetados ----- */
    for (let index = 0; index < count; index += 1) {
      if (result[index]) continue;

      const anchor = preferred[index] ?? originalShortcuts[index];

      const position = findWidgetPosition(
        { columns: 1, rows: 1 },
        base,
        occupied,
        anchor,
      );

      if (!position) return null;

      assign(index, position);
    }

    return result;
  }

  let shortcuts = placeShortcuts(widgetOccupied);

  /* ----- Posicionamento dos widgets ----- */
  for (const widget of widgets) {
    if (!widget.visible) continue;

    const { instanceId, size } = widget;

    if (
      !instanceId ||
      !size ||
      !Number.isInteger(size.columns) ||
      !Number.isInteger(size.rows) ||
      size.columns < 1 ||
      size.rows < 1
    ) {
      if (instanceId) {
        blockedWidgets.push(instanceId);
      }

      continue;
    }

    let accepted = false;

    for (const position of widgetCandidates(
      size,
      base,
      widget.position,
      true,
    )) {
      if (!canPlaceWidget(position, size, base, widgetOccupied)) {
        continue;
      }

      const trialOccupied = occupyWidgetCells(
        widgetOccupied,
        position,
        size,
      );

      const trialShortcuts = placeShortcuts(trialOccupied);

      if (!trialShortcuts) continue;

      for (const cell of trialOccupied) {
        widgetOccupied.add(cell);
      }

      shortcuts = trialShortcuts;

      placements[instanceId] = {
        instanceId,
        widgetId: widget.widgetId,
        position,
        size,
        left: getCellLeft(position.column, base),
        top: getCellTop(position.row),
        width: getWidgetWidth(size.columns, base),
        height: size.rows * ROW_STEP,
      };

      accepted = true;
      break;
    }

    if (!accepted) {
      blockedWidgets.push(instanceId);
    }
  }

  return {
    ...base,
    shortcuts: shortcuts ?? base.shortcuts,
    widgets: placements,
    blockedWidgets,
  };
}

/* === Movimentação dos atalhos === */
/* ----- Movimentação individual e em grupo ----- */
export function moveDesktopShortcuts(
  shortcuts,
  layout,
  selectedIds,
  anchorId,
  column,
  row,
) {
  const anchor = layout.shortcuts[
    shortcuts.findIndex((app) => app.id === anchorId)
  ];

  if (!anchor) return null;

  const dx = column - getCellColumn(anchor.left, layout);
  const dy = row - getCellRow(anchor.top);

  const targets = new Map();
  const stationary = new Set();

  /* ----- Posições de origem e destino ----- */
  for (let index = 0; index < shortcuts.length; index += 1) {
    const position = layout.shortcuts[index];

    if (!position) return null;

    const current = {
      column: getCellColumn(position.left, layout),
      row: getCellRow(position.top),
    };

    if (selectedIds.includes(shortcuts[index].id)) {
      targets.set(shortcuts[index].id, {
        column: current.column + dx,
        row: current.row + dy,
      });
    } else {
      stationary.add(key(current.column, current.row));
    }
  }

  if (!targets.size) return null;

  /* ----- Ocupação dos widgets ----- */
  const widgetOccupied = new Set();
  const placedWidgets = Object.values(layout.widgets ?? {});

  if (
    placedWidgets.length === 0 &&
    layout.widget &&
    layout.widgetSize
  ) {
    placedWidgets.push({
      position: {
        column: getCellColumn(layout.widget.left, layout),
        row: getCellRow(layout.widget.top),
      },
      size: layout.widgetSize,
    });
  }

  for (const widget of placedWidgets) {
    for (const cell of getWidgetCells(widget.position, widget.size)) {
      widgetOccupied.add(key(cell.column, cell.row));
    }
  }

  /* ----- Validação dos destinos ----- */
  for (const position of targets.values()) {
    if (
      !isDesktopCellAvailable(position.column, position.row, layout) ||
      stationary.has(key(position.column, position.row))
    ) {
      return null;
    }

    if (widgetOccupied.has(key(position.column, position.row))) {
      return null;
    }
  }

  /* ----- Resultado da movimentação ----- */
  return Object.fromEntries(
    shortcuts.map((app, index) => [
      app.id,
      targets.get(app.id) ?? {
        column: getCellColumn(layout.shortcuts[index].left, layout),
        row: getCellRow(layout.shortcuts[index].top),
      },
    ]),
  );
}

/* === Persistência das posições === */
/* ----- Validação do layout completo ----- */
export function getPersistableShortcutPositions(shortcuts, layout) {
  if (
    !Array.isArray(shortcuts) ||
    !Array.isArray(layout?.shortcuts) ||
    shortcuts.length !== layout.shortcuts.length
  ) {
    return null;
  }

  const occupied = new Set();
  const placedWidgets = Object.values(layout.widgets ?? {});

  /* ----- Compatibilidade com o widget anterior ----- */
  if (
    placedWidgets.length === 0 &&
    layout.widget &&
    layout.widgetSize
  ) {
    placedWidgets.push({
      position: {
        column: getCellColumn(layout.widget.left, layout),
        row: getCellRow(layout.widget.top),
      },
      size: layout.widgetSize,
    });
  }

  /* ----- Validação da ocupação dos widgets ----- */
  for (const widget of placedWidgets) {
    const cells = getWidgetCells(widget.position, widget.size);

    if (
      !widget.size ||
      cells.length !== widget.size.columns * widget.size.rows
    ) {
      return null;
    }

    for (const { column, row } of cells) {
      if (!isDesktopCellAvailable(column, row, layout)) {
        return null;
      }

      const cellKey = `${column}:${row}`;

      if (occupied.has(cellKey)) {
        return null;
      }

      occupied.add(cellKey);
    }
  }

  /* ----- Validação da ocupação dos atalhos ----- */
  const positions = {};
  const ids = new Set();

  for (let index = 0; index < shortcuts.length; index += 1) {
    const app = shortcuts[index];
    const point = layout.shortcuts[index];

    if (!app?.id || !point || ids.has(app.id)) {
      return null;
    }

    ids.add(app.id);

    const column = getCellColumn(point.left, layout);
    const row = getCellRow(point.top);

    if (!isDesktopCellAvailable(column, row, layout)) {
      return null;
    }

    const cellKey = `${column}:${row}`;

    if (occupied.has(cellKey)) {
      return null;
    }

    occupied.add(cellKey);

    positions[app.id] = { column, row };
  }

  return positions;
}

/* === Seleção por área === */
/* ----- Identificação dos atalhos selecionados ----- */
export function getShortcutsInArea(shortcuts, positions, area) {
  return shortcuts
    .filter((_app, index) => {
      const position = positions[index];

      return (
        position &&
        position.left < area.left + area.width &&
        position.left + SHORTCUT_WIDTH > area.left &&
        position.top < area.top + area.height &&
        position.top + 82 > area.top
      );
    })
    .map((app) => app.id);
}
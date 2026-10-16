export const COLUMN_STEP = 90;
export const ROW_STEP = 88;

export const SHORTCUT_WIDTH = 82;
export const MIN_COLUMN_STEP = 82;

export const TASKBAR_RESERVED_WIDTH = 480;
export const TASKBAR_RESERVED_BOTTOM = 64;

const key = (column, row) => `${column}:${row}`;

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
    top < layout.viewportHeight && top + ROW_STEP > layout.viewportHeight - TASKBAR_RESERVED_BOTTOM;

  if (!isBottomArea) {
    return true;
  }

  const reservedWidth = Math.min(TASKBAR_RESERVED_WIDTH, layout.width);

  const reservedLeft = (layout.width - reservedWidth) / 2;

  // Inferior esquerdo: aplicativos e widgets.
  // Inferior central: Taskbar.
  // Inferior direito: futuras notificações.
  return left + SHORTCUT_WIDTH <= reservedLeft;
}

/**
 * Retorna todas as células ocupadas por um widget.
 * As dimensões são expressas em células da grade.
 */
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

/**
 * Verifica se um widget cabe na grade sem ocupar
 * células reservadas ou já utilizadas.
 */
export function canPlaceWidget(position, size, layout, occupied = new Set()) {
  const cells = getWidgetCells(position, size);

  if (cells.length === 0 || cells.length !== size.columns * size.rows) {
    return false;
  }

  return cells.every(
    ({ column, row }) =>
      isDesktopCellAvailable(column, row, layout) && !occupied.has(`${column}:${row}`),
  );
}

/**
 * Marca todas as células de um widget como ocupadas.
 * Retorna um novo Set, preservando o original.
 */
export function occupyWidgetCells(occupied, position, size) {
  const next = new Set(occupied);

  for (const { column, row } of getWidgetCells(position, size)) {
    next.add(`${column}:${row}`);
  }

  return next;
}

/**
 * Procura posições válidas na grade.
 * Se houver preferência, prioriza posições próximas.
 */
export function findWidgetPosition(size, layout, occupied = new Set(), preferred = null) {
  const candidates = [];

  for (let column = 0; column < layout.columns; column += 1) {
    for (let row = 0; row < layout.rows; row += 1) {
      const position = { column, row };

      if (canPlaceWidget(position, size, layout, occupied)) {
        candidates.push(position);
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  if (preferred && Number.isInteger(preferred.column) && Number.isInteger(preferred.row)) {
    candidates.sort((a, b) => {
      const distanceA = Math.abs(a.column - preferred.column) + Math.abs(a.row - preferred.row);

      const distanceB = Math.abs(b.column - preferred.column) + Math.abs(b.row - preferred.row);

      return distanceA - distanceB || a.column - b.column || a.row - b.row;
    });
  }

  return candidates[0];
}

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

  const columns = Math.max(1, Math.floor((width - SHORTCUT_WIDTH) / MIN_COLUMN_STEP) + 1);

  const columnStep = columns > 1 ? (width - SHORTCUT_WIDTH) / (columns - 1) : COLUMN_STEP;

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

    for (let column = layout.columns - widgetColumns; column >= 0 && !chosen; column -= 1) {
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

  if (available.length < count) {
    layout.overflow = true;
    layout.rows = Math.max(
      layout.rows,
      Math.ceil(height / ROW_STEP) + Math.ceil(count / layout.columns) + 1,
    );
    layout.height = layout.rows * ROW_STEP;
    available = cells();
  }

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

  let nextCell = 0;

  for (let index = 0; index < count; index += 1) {
    if (result[index]) continue;

    while (
      nextCell < available.length &&
      occupied.has(key(available[nextCell].column, available[nextCell].row))
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

/**
 * Calcula a distribuição de múltiplos widgets
 * sem alterar a organização atual do Desktop.
 *
 * Nesta fase, os atalhos existentes têm prioridade.
 * A reorganização inteligente será integrada na W2.3.
 */

export function getMultiWidgetLayout(count, width, height, widgets = [], preferred = []) {
  const base = getDesktopLayout(count, width, height, null, preferred);

  const placements = {};
  const blockedWidgets = [];
  const widgetOccupied = new Set();

  // Preserva a posição calculada anteriormente para cada atalho.
  const originalShortcuts = base.shortcuts.map((point) =>
    point
      ? {
          column: getCellColumn(point.left, base),
          row: getCellRow(point.top),
        }
      : null,
  );

  function placeShortcuts(reserved) {
    const occupied = new Set(reserved);
    const result = Array(count).fill(null);

    function available(position) {
      return (
        position &&
        isDesktopCellAvailable(position.column, position.row, base) &&
        !occupied.has(key(position.column, position.row))
      );
    }

    function assign(index, position) {
      result[index] = {
        left: getCellLeft(position.column, base),
        top: getCellTop(position.row),
      };

      occupied.add(key(position.column, position.row));
    }

    // Primeira passagem: manter posições escolhidas pelo usuário.
    for (let index = 0; index < count; index += 1) {
      if (available(preferred[index])) {
        assign(index, preferred[index]);
      }
    }

    // Segunda passagem: manter a distribuição anterior.
    for (let index = 0; index < count; index += 1) {
      if (!result[index] && available(originalShortcuts[index])) {
        assign(index, originalShortcuts[index]);
      }
    }

    // Terceira passagem: realocar somente os atalhos afetados.
    for (let index = 0; index < count; index += 1) {
      if (result[index]) continue;

      const anchor = preferred[index] ?? originalShortcuts[index];

      const position = findWidgetPosition({ columns: 1, rows: 1 }, base, occupied, anchor);

      if (!position) return null;

      assign(index, position);
    }

    return result;
  }

  let shortcuts = placeShortcuts(widgetOccupied);

  // Posições de widgets são avaliadas sem modificar
  // a distribuição aceita anteriormente.
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
      if (instanceId) blockedWidgets.push(instanceId);
      continue;
    }

    const candidates = [];

    for (let column = 0; column < base.columns; column += 1) {
      for (let row = 0; row < base.rows; row += 1) {
        const position = { column, row };

        if (canPlaceWidget(position, size, base, widgetOccupied)) {
          candidates.push(position);
        }
      }
    }

    const desired = widget.position;

    if (Number.isInteger(desired?.column) && Number.isInteger(desired?.row)) {
      candidates.sort((a, b) => {
        const distanceA = Math.abs(a.column - desired.column) + Math.abs(a.row - desired.row);

        const distanceB = Math.abs(b.column - desired.column) + Math.abs(b.row - desired.row);

        return distanceA - distanceB || a.column - b.column || a.row - b.row;
      });
    } else {
      // Sem posição salva, prioriza a lateral direita.
      candidates.sort((a, b) => b.column - a.column || a.row - b.row);
    }

    let accepted = false;

    for (const position of candidates) {
      const trialOccupied = occupyWidgetCells(widgetOccupied, position, size);

      const trialShortcuts = placeShortcuts(trialOccupied);

      // Só aceita quando todos os atalhos continuam presentes.
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

export function moveDesktopShortcuts(shortcuts, layout, selectedIds, anchorId, column, row) {
  const anchor = layout.shortcuts[shortcuts.findIndex((app) => app.id === anchorId)];

  if (!anchor) return null;

  const dx = column - getCellColumn(anchor.left, layout);
  const dy = row - getCellRow(anchor.top);

  const targets = new Map();
  const stationary = new Set();

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

  const widgetOccupied = new Set();

  const placedWidgets = Object.values(layout.widgets ?? {});

  // Compatibilidade com o layout antigo do relógio.
  if (placedWidgets.length === 0 && layout.widget && layout.widgetSize) {
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

/**
 * Converte as posições dos atalhos calculadas pelo layout
 * para o formato utilizado por desktopPreferences.
 *
 * Valida as células ocupadas pelos widgets e atalhos,
 * impedindo sobreposições e posições inválidas.
 *
 * Não modifica o layout nem salva preferências.
 */
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

  // Compatibilidade com o layout antigo do Relógio.
  if (placedWidgets.length === 0 && layout.widget && layout.widgetSize) {
    placedWidgets.push({
      position: {
        column: getCellColumn(layout.widget.left, layout),
        row: getCellRow(layout.widget.top),
      },
      size: layout.widgetSize,
    });
  }

  // Validar todas as células ocupadas pelos widgets.
  for (const widget of placedWidgets) {
    const cells = getWidgetCells(widget.position, widget.size);

    if (!widget.size || cells.length !== widget.size.columns * widget.size.rows) {
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

  const positions = {};
  const ids = new Set();

  // Validar os atalhos contra a ocupação completa da grade.
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

export function getShortcutsInArea(shortcuts, positions, area) {
  return shortcuts
    .filter((_app, index) => {
      const p = positions[index];

      return (
        p &&
        p.left < area.left + area.width &&
        p.left + SHORTCUT_WIDTH > area.left &&
        p.top < area.top + area.height &&
        p.top + 82 > area.top
      );
    })
    .map((app) => app.id);
}

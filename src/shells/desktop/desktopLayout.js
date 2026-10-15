export const COLUMN_STEP = 90;
export const ROW_STEP = 88;
export const TASKBAR_RESERVED_WIDTH = 720;
export const TASKBAR_RESERVED_BOTTOM = 64;

export function isDesktopCellAvailable(column, row, layout) {
  if (
    !Number.isInteger(column) ||
    !Number.isInteger(row) ||
    column < 0 ||
    row < 0 ||
    column >= layout.columns ||
    row >= layout.rows
  )
    return false;
  const left = column * COLUMN_STEP;
  const top = row * ROW_STEP;
  const reservedWidth = Math.min(TASKBAR_RESERVED_WIDTH, layout.width);
  const reservedLeft = (layout.width - reservedWidth) / 2;
  return !(
    left < reservedLeft + reservedWidth &&
    left + COLUMN_STEP > reservedLeft &&
    top + ROW_STEP > layout.height - TASKBAR_RESERVED_BOTTOM
  );
}

export function getDesktopLayout(count, width, height, widget, preferred = []) {
  if (width <= 0 || height <= 0)
    return { shortcuts: [], widget: null, width: 0, height: 0, columns: 0, rows: 0 };
  const layout = {
    width: Math.max(COLUMN_STEP, width),
    height,
    columns: Math.max(1, Math.floor(width / COLUMN_STEP)),
    rows: Math.floor(height / ROW_STEP),
    shortcuts: [],
    widget: null,
    widgetSize: widget?.size,
    overflow: false,
  };
  function cells() {
    const result = [];
    for (let column = 0; column < layout.columns; column += 1) {
      for (let row = 0; row < layout.rows; row += 1) {
        if (isDesktopCellAvailable(column, row, layout)) result.push({ column, row });
      }
    }
    return result;
  }
  let available = cells();
  const occupied = new Set();
  const key = (column, row) => `${column}:${row}`;
  const widgetColumns = widget?.size?.columns ?? 2;
  const widgetRows = widget?.size?.rows ?? 2;
  function fits(column, row) {
    for (let x = column; x < column + widgetColumns; x += 1) {
      for (let y = row; y < row + widgetRows; y += 1) {
        if (!isDesktopCellAvailable(x, y, layout)) return false;
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
    )
      chosen = widget.position;
    for (let column = layout.columns - widgetColumns; column >= 0 && !chosen; column -= 1) {
      for (let row = 0; row < layout.rows; row += 1) {
        if (fits(column, row)) {
          chosen = { column, row };
          break;
        }
      }
    }
    if (chosen) {
      layout.widget = { left: chosen.column * COLUMN_STEP, top: chosen.row * ROW_STEP };
      for (let x = chosen.column; x < chosen.column + widgetColumns; x += 1) {
        for (let y = chosen.row; y < chosen.row + widgetRows; y += 1) occupied.add(key(x, y));
      }
    }
  }
  layout.widgetBlocked = Boolean(widget?.visible && !layout.widget);
  if (available.length < count) {
    layout.overflow = true;
    layout.rows = Math.max(layout.rows, Math.ceil(count / layout.columns) + 1);
    layout.height = layout.rows * ROW_STEP;
    available = cells();
  }
  // Preferências são projetadas na área atual; resize não altera os dados salvos.
  const result = Array.from({ length: count }, () => null);
  for (let index = 0; index < count; index += 1) {
    const position = preferred[index];
    if (
      position &&
      isDesktopCellAvailable(position.column, position.row, layout) &&
      !occupied.has(key(position.column, position.row))
    ) {
      result[index] = { left: position.column * COLUMN_STEP, top: position.row * ROW_STEP };
      occupied.add(key(position.column, position.row));
    }
  }
  let nextCell = 0;
  for (let index = 0; index < count; index += 1) {
    if (result[index]) continue;
    while (
      nextCell < available.length &&
      occupied.has(key(available[nextCell].column, available[nextCell].row))
    )
      nextCell += 1;
    const cell = available[nextCell++];
    if (!cell) break;
    result[index] = { left: cell.column * COLUMN_STEP, top: cell.row * ROW_STEP };
    occupied.add(key(cell.column, cell.row));
  }
  layout.shortcuts = result;
  return layout;
}

export function moveDesktopShortcuts(shortcuts, layout, selectedIds, anchorId, column, row) {
  const anchor = layout.shortcuts[shortcuts.findIndex((app) => app.id === anchorId)];
  if (!anchor) return null;
  const dx = column - anchor.left / COLUMN_STEP;
  const dy = row - anchor.top / ROW_STEP;
  const targets = new Map();
  const stationary = new Set();
  for (let index = 0; index < shortcuts.length; index += 1) {
    const position = layout.shortcuts[index];
    if (!position) return null;
    const current = { column: position.left / COLUMN_STEP, row: position.top / ROW_STEP };
    if (selectedIds.includes(shortcuts[index].id))
      targets.set(shortcuts[index].id, { column: current.column + dx, row: current.row + dy });
    else stationary.add(`${current.column}:${current.row}`);
  }
  if (!targets.size) return null;
  for (const position of targets.values()) {
    if (
      !isDesktopCellAvailable(position.column, position.row, layout) ||
      stationary.has(`${position.column}:${position.row}`)
    )
      return null;
    if (
      layout.widget &&
      position.column * COLUMN_STEP <
        layout.widget.left + layout.widgetSize.columns * COLUMN_STEP &&
      (position.column + 1) * COLUMN_STEP > layout.widget.left &&
      position.row * ROW_STEP < layout.widget.top + layout.widgetSize.rows * ROW_STEP &&
      (position.row + 1) * ROW_STEP > layout.widget.top
    )
      return null;
  }
  return Object.fromEntries(
    shortcuts.map((app, index) => [
      app.id,
      targets.get(app.id) ?? {
        column: layout.shortcuts[index].left / COLUMN_STEP,
        row: layout.shortcuts[index].top / ROW_STEP,
      },
    ]),
  );
}

export function getShortcutsInArea(shortcuts, positions, area) {
  return shortcuts
    .filter((_app, index) => {
      const p = positions[index];
      return (
        p &&
        p.left < area.left + area.width &&
        p.left + 82 > area.left &&
        p.top < area.top + area.height &&
        p.top + 82 > area.top
      );
    })
    .map((app) => app.id);
}

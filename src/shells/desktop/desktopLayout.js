export const COLUMN_STEP = 90;
export const ROW_STEP = 88;
export const TASKBAR_RESERVED_WIDTH = 720;
export const TASKBAR_RESERVED_BOTTOM = 64;
export function getDesktopLayout(count, width, height, widget) {
  const columns = Math.floor(width / COLUMN_STEP);
  const rows = Math.floor(height / ROW_STEP);
  if (columns < 1 || rows < 1) {
    return {
      shortcuts: [],
      widget: null,
    };
  }
  const occupied = new Set();
  const shortcuts = [];
  const reservedWidth = Math.min(TASKBAR_RESERVED_WIDTH, width);
  const reservedLeft = (width - reservedWidth) / 2;
  const reservedRight = reservedLeft + reservedWidth;
  const reservedTop = height - TASKBAR_RESERVED_BOTTOM;
  function isAvailable(column, row) {
    if (column >= columns || row >= rows) return false;
    const left = column * COLUMN_STEP;
    const top = row * ROW_STEP;
    const overlapsTaskbar =
      left < reservedRight &&
      left + COLUMN_STEP > reservedLeft &&
      top < height &&
      top + ROW_STEP > reservedTop;
    return !occupied.has(`${column}:${row}`) && !overlapsTaskbar;
  }

  // Reserva duas colunas e duas linhas para o relógio.
  let widgetPosition = null;
  const widgetColumns = widget?.size?.columns ?? 2;
  const widgetRows = widget?.size?.rows ?? 2;
  if (widget?.visible && columns >= widgetColumns && rows >= widgetRows) {
    const preferredColumn = widget.position?.column;
    const preferredRow = widget.position?.row;
    const column =
      preferredColumn !== undefined &&
      preferredColumn !== null &&
      preferredColumn + widgetColumns <= columns
        ? preferredColumn
        : columns - widgetColumns;
    const row =
      preferredRow !== undefined && preferredRow !== null && preferredRow + widgetRows <= rows
        ? preferredRow
        : 0;
    let available = true;
    for (let x = column; x < column + widgetColumns; x += 1) {
      for (let y = row; y < row + widgetRows; y += 1) {
        if (!isAvailable(x, y)) {
          available = false;
        }
      }
    }
    if (available) {
      for (let x = column; x < column + widgetColumns; x += 1) {
        for (let y = row; y < row + widgetRows; y += 1) {
          occupied.add(`${x}:${y}`);
        }
      }
      widgetPosition = {
        left: column * COLUMN_STEP,
        top: row * ROW_STEP,
      };
    }
  }

  // Atalhos e widgets utilizam o mesmo mapa de ocupação.
  for (let column = 0; column < columns && shortcuts.length < count; column += 1) {
    for (let row = 0; row < rows && shortcuts.length < count; row += 1) {
      if (!isAvailable(column, row)) continue;
      occupied.add(`${column}:${row}`);
      shortcuts.push({
        left: column * COLUMN_STEP,
        top: row * ROW_STEP,
      });
    }
  }
  return {
    shortcuts,
    widget: widgetPosition,
  };
}

// Avisos temporários: o histórico é mantido pelo notificationManager.

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


  // Widgets e atalhos compartilham a mesma grade.
  let widgetPosition = null;

  const widgetColumns = widget?.size?.columns ?? 2;
  const widgetRows = widget?.size?.rows ?? 2;

  function canFitWidget(column, row) {
    if (
      column < 0 ||
      row < 0 ||
      column + widgetColumns > columns ||
      row + widgetRows > rows
    ) {
      return false;
    }

    for (let x = column; x < column + widgetColumns; x += 1) {
      for (let y = row; y < row + widgetRows; y += 1) {
        if (!isAvailable(x, y)) return false;
      }
    }

    return true;
  }

  if (
    widget?.visible &&
    Number.isInteger(widgetColumns) &&
    Number.isInteger(widgetRows) &&
    widgetColumns > 0 &&
    widgetRows > 0
  ) {
    const preferredColumn = widget.position?.column;
    const preferredRow = widget.position?.row;

    let chosenPosition = null;

    // Respeitar a posição salva quando continuar válida.
    if (
      Number.isInteger(preferredColumn) &&
      Number.isInteger(preferredRow) &&
      canFitWidget(preferredColumn, preferredRow)
    ) {
      chosenPosition = {
        column: preferredColumn,
        row: preferredRow,
      };
    }

    // Procurar outra posição quando a preferida estiver indisponível.
    if (!chosenPosition) {
      for (
        let column = columns - widgetColumns;
        column >= 0 && !chosenPosition;
        column -= 1
      ) {
        for (let row = 0; row < rows; row += 1) {
          if (canFitWidget(column, row)) {
            chosenPosition = { column, row };
            break;
          }
        }
      }
    }

    if (chosenPosition) {
      for (
        let x = chosenPosition.column;
        x < chosenPosition.column + widgetColumns;
        x += 1
      ) {
        for (
          let y = chosenPosition.row;
          y < chosenPosition.row + widgetRows;
          y += 1
        ) {
          occupied.add(`${x}:${y}`);
        }
      }

      widgetPosition = {
        left: chosenPosition.column * COLUMN_STEP,
        top: chosenPosition.row * ROW_STEP,
      };
    }
  }

  // Não permitir que o widget retire posições dos atalhos.
  if (widgetPosition) {
    let availableForShortcuts = 0;

    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        if (isAvailable(column, row)) {
          availableForShortcuts += 1;
        }
      }
    }

    if (availableForShortcuts < count) {
      for (const cell of occupied) {
        occupied.delete(cell);
      }

      widgetPosition = null;
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

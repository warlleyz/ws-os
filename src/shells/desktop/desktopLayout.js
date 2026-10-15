
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
  return (
    (columns - 1) * getColumnStep(layout) +
    SHORTCUT_WIDTH
  );
}

export function clampDesktopDrag(
  dx,
  dy,
  bounds,
  layout,
) {
  const minDx = -bounds.left;
  const maxDx = Math.max(
    minDx,
    layout.width - bounds.right,
  );

  const minDy = -bounds.top;
  const maxDy = Math.max(
    minDy,
    layout.height - bounds.bottom,
  );

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
    top + ROW_STEP >
    layout.viewportHeight - TASKBAR_RESERVED_BOTTOM;

  if (!isBottomArea) {
    return true;
  }

  const reservedWidth = Math.min(
    TASKBAR_RESERVED_WIDTH,
    layout.width,
  );

  const reservedLeft = (layout.width - reservedWidth) / 2;

  // Inferior esquerdo: aplicativos e widgets.
  // Inferior central: Taskbar.
  // Inferior direito: futuras notificações.
  return left + SHORTCUT_WIDTH <= reservedLeft;
}

export function getDesktopLayout(
  count,
  width,
  height,
  widget,
  preferred = [],
) {
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
    Math.floor(
      (width - SHORTCUT_WIDTH) / MIN_COLUMN_STEP,
    ) + 1,
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

      for (
        let x = chosen.column;
        x < chosen.column + widgetColumns;
        x += 1
      ) {
        for (
          let y = chosen.row;
          y < chosen.row + widgetRows;
          y += 1
        ) {
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
      Math.ceil(count / layout.columns) + 1,
    );
    layout.height = layout.rows * ROW_STEP;
    available = cells();
  }

  const result = Array.from({ length: count }, () => null);

  for (let index = 0; index < count; index += 1) {
    const position = preferred[index];

    if (
      position &&
      isDesktopCellAvailable(
        position.column,
        position.row,
        layout,
      ) &&
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
      occupied.has(
        key(
          available[nextCell].column,
          available[nextCell].row,
        ),
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

  const widgetLeft = layout.widget
    ? getCellColumn(layout.widget.left, layout)
    : -1;

  const widgetTop = layout.widget
    ? getCellRow(layout.widget.top)
    : -1;

  for (const position of targets.values()) {
    if (
      !isDesktopCellAvailable(
        position.column,
        position.row,
        layout,
      ) ||
      stationary.has(key(position.column, position.row))
    ) {
      return null;
    }

    if (
      layout.widget &&
      position.column >= widgetLeft &&
      position.column < widgetLeft + layout.widgetSize.columns &&
      position.row >= widgetTop &&
      position.row < widgetTop + layout.widgetSize.rows
    ) {
      return null;
    }
  }

  return Object.fromEntries(
    shortcuts.map((app, index) => [
      app.id,
      targets.get(app.id) ?? {
        column: getCellColumn(
          layout.shortcuts[index].left,
          layout,
        ),
        row: getCellRow(layout.shortcuts[index].top),
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
        p.left + SHORTCUT_WIDTH > area.left &&
        p.top < area.top + area.height &&
        p.top + 82 > area.top
      );
    })
    .map((app) => app.id);
}

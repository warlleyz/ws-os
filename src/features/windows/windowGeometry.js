export const MIN_WIDTH = 300;
export const MIN_HEIGHT = 220;
export const WINDOW_GAP = 8;
export const SNAP_DISTANCE = 24;
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
export function getBounds(element) {
  const parent = element?.offsetParent;
  return {
    width: parent?.clientWidth ?? window.innerWidth,
    height: parent?.clientHeight ?? window.innerHeight,
  };
}
export function readGeometry(element) {
  const rect = element.getBoundingClientRect();
  const parentRect = element.offsetParent?.getBoundingClientRect();
  return {
    x: rect.left - (parentRect?.left ?? 0),
    y: rect.top - (parentRect?.top ?? 0),
    width: rect.width,
    height: rect.height,
  };
}
export function constrainGeometry(geometry, bounds) {
  const gapX = Math.min(WINDOW_GAP, bounds.width / 2);
  const gapY = Math.min(WINDOW_GAP, bounds.height / 2);
  const availableWidth = Math.max(0, bounds.width - gapX * 2);
  const availableHeight = Math.max(0, bounds.height - gapY * 2);
  const width = clamp(geometry.width, Math.min(MIN_WIDTH, availableWidth), availableWidth);
  const height = clamp(geometry.height, Math.min(MIN_HEIGHT, availableHeight), availableHeight);
  return {
    x: clamp(geometry.x, gapX, Math.max(gapX, bounds.width - width - gapX)),
    y: clamp(geometry.y, gapY, Math.max(gapY, bounds.height - height - gapY)),
    width,
    height,
  };
}
export function applyGeometry(element, geometry, bounds = getBounds(element)) {
  const next = constrainGeometry(geometry, bounds);
  const styles = {
    left: `${next.x}px`,
    top: `${next.y}px`,
    width: `${next.width}px`,
    height: `${next.height}px`,
  };
  for (const [property, value] of Object.entries(styles)) {
    if (element.style[property] !== value) element.style[property] = value;
  }
  return next;
}
export function resizeGeometry(initial, direction, dx, dy, bounds) {
  const gapX = Math.min(WINDOW_GAP, bounds.width / 2);
  const gapY = Math.min(WINDOW_GAP, bounds.height / 2);
  let left = initial.x;
  let top = initial.y;
  let right = initial.x + initial.width;
  let bottom = initial.y + initial.height;
  const minWidth = Math.min(MIN_WIDTH, bounds.width - gapX * 2);
  const minHeight = Math.min(MIN_HEIGHT, bounds.height - gapY * 2);
  if (direction.includes('e')) {
    right = clamp(right + dx, left + minWidth, bounds.width - gapX);
  }
  if (direction.includes('w')) {
    left = clamp(left + dx, gapX, right - minWidth);
  }
  if (direction.includes('s')) {
    bottom = clamp(bottom + dy, top + minHeight, bounds.height - gapY);
  }
  if (direction.includes('n')) {
    top = clamp(top + dy, gapY, bottom - minHeight);
  }
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}
export function getSnapMode(x, y, width, height) {
  const left = x <= SNAP_DISTANCE;
  const right = x >= width - SNAP_DISTANCE;
  const top = y <= SNAP_DISTANCE;
  const bottom = y >= height - SNAP_DISTANCE;
  if (top && left) return 'top-left';
  if (top && right) return 'top-right';
  if (bottom && left) return 'bottom-left';
  if (bottom && right) return 'bottom-right';
  if (top) return 'maximized';
  if (left) return 'left';
  if (right) return 'right';
  return null;
}

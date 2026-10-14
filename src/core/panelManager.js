export function resolvePanel(value, current, panel) {
  const next = typeof value === 'function' ? value(current === panel) : value;
  return next ? panel : current === panel ? null : current;
}

export function AppIcon({ app, size = 18 }) {
  const Icon = app?.icon;
  if (Icon) {
    return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
  }
  return <span aria-hidden="true">{app?.name?.charAt(0) ?? '?'}</span>;
}

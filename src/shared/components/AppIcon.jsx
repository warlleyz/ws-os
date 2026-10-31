import { memo } from 'react';

/* === ÍCONES DOS APLICATIVOS === */
/* ----- RENDERIZAÇÃO DO ÍCONE ----- */
function AppIconView({ app, size = 18 }) {
  const Icon = app?.icon;

  if (Icon) {
    return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
  }

  return <span aria-hidden="true">{app?.name?.charAt(0) ?? '?'}</span>;
}

/* ----- MEMORIZAÇÃO DO COMPONENTE ----- */
export const AppIcon = memo(AppIconView);
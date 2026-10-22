/* === Identidade oficial === */
/* ----- Seleção compartilhada pelo boot e pelo ícone da página ----- */
export function getBrandingLogo(theme, accent, baseUrl = '/') {
  const resolvedTheme = ['dark', 'light'].includes(theme) ? theme : 'dark';
  const resolvedAccent = ['blue', 'green', 'violet'].includes(accent) ? accent : 'blue';
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  return base + 'assets/branding/ws-os-' + resolvedAccent + '-' + resolvedTheme + '.svg';
}

/* ----- Atualização do ícone sem duplicar elementos no documento ----- */
export function applyBrandingFavicon(theme, accent, baseUrl = '/') {
  let icon = document.querySelector('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.appendChild(icon);
  }
  icon.type = 'image/svg+xml';
  icon.href = getBrandingLogo(theme, accent, baseUrl);
}

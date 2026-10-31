/* === ÍCONES DO SISTEMA === */
export function SystemIcon({ name, size = 18 }) {
  /* ----- DEFINIÇÕES DOS ÍCONES ----- */
  const paths = {
    menu: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    controls: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="2" fill="currentColor" />
        <circle cx="16" cy="17" r="2" fill="currentColor" />
      </>
    ),
    wally: (
      <>
        <rect x="4" y="6" width="16" height="14" rx="4" />
        <path d="M12 3v3M9 3h6" />
        <path d="M9 12h.01M15 12h.01" strokeWidth="3" />
        <path d="M9 16c2 1.5 4 1.5 6 0" />
      </>
    ),
    weather: (
      <>
        <path d="M7 18a4 4 0 0 1 0-8 6 6 0 0 1 11-1 4.5 4.5 0 0 1 0 9H7Z" />
        <path d="M6 3V2M2 7H1M3.5 4.5l-1-1" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  /* ----- RENDERIZAÇÃO DO SVG ----- */
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.menu}
    </svg>
  );
}
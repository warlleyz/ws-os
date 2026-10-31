
/* === ILUSTRAÇÕES DO CATÁLOGO DE JOGOS === */
export default function GameArtwork({ game }) {

  /* ----- SELEÇÃO DAS ILUSTRAÇÕES ----- */
  const artwork = {
    snake: 'snake.webp',
    memory: 'memory.webp',
    mines: 'mines.webp',
    flappy: 'flappy.webp',
    solitaire: 'solitaire.webp',
  };

  /* ----- RENDERIZAÇÃO ----- */
  const file = artwork[game];

  if (!file) return null;

  return (
    <img
      src={`${import.meta.env.BASE_URL}assets/games/${file}`}
      alt=""
      loading="lazy"
      decoding="async"
      draggable="false"
    />
  );
}
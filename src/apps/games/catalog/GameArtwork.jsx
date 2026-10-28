/* === ILUSTRAÇÕES DO CATÁLOGO DE JOGOS === */
export default function GameArtwork({ game }) {
    switch (game) {
        case 'snake':
            return (
                <img
                    src="/assets/games/snake.jpg"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                />
            );

        case 'memory':
            return (
                <img
                    src="/assets/games/memory.png"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                />
            );

        case 'mines':
            return (
                <img
                    src="/assets/games/mines.png"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                />
            );

        case 'flappy':
            return (
                <img
                    src="/assets/games/flappy.png"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                />
            );

        case 'solitaire':
            return (
                <img
                    src="/assets/games/solitaire.png"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                />
            );;

        default:
            return null;
    }
}
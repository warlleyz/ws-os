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
                <svg viewBox="0 0 320 170" aria-hidden="true">
                    <circle cx="240" cy="42" r="32" fill="#9ed8eb" opacity=".14" />

                    <g fill="#4b9f86">
                        <rect x="55" y="0" width="51" height="60" rx="3" />
                        <rect x="49" y="52" width="63" height="12" rx="2" />
                        <rect x="55" y="125" width="51" height="45" rx="3" />
                        <rect x="49" y="119" width="63" height="12" rx="2" />
                        <rect x="252" y="0" width="51" height="44" rx="3" />
                        <rect x="246" y="36" width="63" height="12" rx="2" />
                        <rect x="252" y="106" width="51" height="64" rx="3" />
                        <rect x="246" y="100" width="63" height="12" rx="2" />
                    </g>

                    <g transform="translate(167 81)">
                        <ellipse rx="31" ry="23" fill="#f9d56e" />
                        <ellipse cx="-8" cy="9" rx="17" ry="9" fill="#efad56" />
                        <circle cx="12" cy="-7" r="10" fill="#fff" />
                        <circle cx="15" cy="-7" r="4" fill="#263d54" />
                        <path d="M22 1l19 7-19 7z" fill="#fa9563" />
                    </g>
                </svg>
            );

        case 'solitaire':
            return (
                <svg viewBox="0 0 320 170" aria-hidden="true">
                    <g transform="translate(60 12)">
                        {[
                            {
                                x: 0,
                                y: 20,
                                r: -12,
                                color: '#5576a8',
                                suit: '♠',
                                label: 'K',
                            },
                            {
                                x: 63,
                                y: 9,
                                r: 5,
                                color: '#cc687a',
                                suit: '♥',
                                label: 'Q',
                            },
                            {
                                x: 126,
                                y: 15,
                                r: -5,
                                color: '#5576a8',
                                suit: '♣',
                                label: 'J',
                            },
                        ].map((card, index) => (
                            <g
                                key={index}
                                transform={`translate(${card.x} ${card.y}) rotate(${card.r} 45 66)`}
                            >
                                <rect
                                    width="90"
                                    height="132"
                                    rx="9"
                                    fill="#f6f3ed"
                                    stroke="#c8ced6"
                                />

                                <text
                                    x="12"
                                    y="24"
                                    fontSize="20"
                                    fontWeight="bold"
                                    fill={card.color}
                                >
                                    {card.label}
                                </text>

                                <text
                                    x="45"
                                    y="86"
                                    fontSize="48"
                                    textAnchor="middle"
                                    fill={card.color}
                                >
                                    {card.suit}
                                </text>
                            </g>
                        ))}
                    </g>
                </svg>
            );

        case 'doom':
            return (
                <svg viewBox="0 0 320 170" aria-hidden="true">
                    <defs>
                        <linearGradient
                            id="games-fps-sky"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop offset="0" stopColor="#471f2b" />
                            <stop offset="1" stopColor="#a24c3d" />
                        </linearGradient>
                    </defs>

                    <rect width="320" height="170" fill="url(#games-fps-sky)" />
                    <circle cx="160" cy="57" r="46" fill="#e78e59" opacity=".65" />

                    <path
                        d="M0 92l45-33 38 26 54-43 48 37 54-30 81 48v73H0z"
                        fill="#2b2633"
                    />

                    <path
                        d="M0 120l95-31 65 39 72-42 88 34v50H0z"
                        fill="#161b25"
                    />

                    <path
                        d="M0 170L113 113h94l113 57"
                        fill="#2e3037"
                    />

                    <path
                        d="M112 170l26-52h44l26 52"
                        fill="#4c4c50"
                    />

                    <path
                        d="M149 139l11-18 11 18v31h-22z"
                        fill="#858b86"
                    />

                    <path
                        d="M160 67v19M150 76h20"
                        stroke="#f2ddd0"
                        strokeWidth="1.5"
                        opacity=".8"
                    />
                </svg>
            );

        default:
            return null;
    }
}
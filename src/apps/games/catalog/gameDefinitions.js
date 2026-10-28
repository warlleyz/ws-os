/* === DIMENSÕES DAS JANELAS === */
export const GAMES_CATALOG_WINDOW = Object.freeze({
    width: 1050,
    height: 800,
});

/* === CATÁLOGO DE JOGOS === */
export const GAMES_CATALOG = [
    {
        id: 'snake',
        window: { width: 1000, height: 825 },
        name: 'Snake',
        category: 'ARCADE',
        description: 'Colete pontos, cresça e evite colisões.',
        controls: 'SETAS / WASD',
    },
    {
        id: 'memory',
        window: { width: 900, height: 775 },
        name: 'Memória',
        category: 'RACIOCÍNIO',
        description: 'Encontre todos os pares com menos tentativas.',
        controls: 'MOUSE / TOQUE',
    },
    {
        id: 'mines',
        window: { width: 850, height: 855 },
        name: 'Campo Minado',
        category: 'ESTRATÉGIA',
        description: 'Revele as casas e evite as minas ocultas.',
        controls: 'MOUSE / TOQUE',
    },
    {
        id: 'flappy',
        window: { width: 900, height: 850 },
        name: 'Flappy Bird',
        category: 'ARCADE',
        description: 'Atravesse obstáculos e bata seu recorde.',
        controls: 'ESPAÇO / TOQUE',
    },
    {
        id: 'solitaire',
        window: { width: 1150, height: 800 },
        name: 'Paciência',
        category: 'CARTAS',
        description: 'Organize as cartas e complete as quatro bases.',
        controls: 'MOUSE / TOQUE',
    },
];

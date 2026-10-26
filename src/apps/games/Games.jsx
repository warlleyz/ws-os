import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Gamepad2, Trophy, Keyboard, LockKeyhole } from 'lucide-react';

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import useAppBack from '../../shared/hooks/useAppBack';
import { useGamePaused } from './gameRecords';

import { useAccessibility } from '../../core/effectsManager';
import useDoomSession from './useDoomSession';
import GameRankings from './GameRankings';
import SnakeGame from './SnakeGame';
import MemoryGame from './MemoryGame';
import MinesGame from './MinesGame';
import FlappyGame from './FlappyGame';
import SolitaireGame from './SolitaireGame';

import '../../styles/apps.css';
import './Games.css';

/* === Catálogo de jogos === */

const games = [
  {
    id: 'snake',
    name: 'Snake',
    category: 'ARCADE',
    description: 'Colete pontos, cresça e evite colisões.',
    controls: 'SETAS / WASD',
    Component: SnakeGame,
  },
  {
    id: 'memory',
    name: 'Memória',
    category: 'RACIOCÍNIO',
    description: 'Encontre todos os pares com menos tentativas.',
    controls: 'MOUSE / TOQUE',
    Component: MemoryGame,
  },
  {
    id: 'mines',
    name: 'Campo Minado',
    category: 'ESTRATÉGIA',
    description: 'Revele as casas e evite as minas ocultas.',
    controls: 'MOUSE / TOQUE',
    Component: MinesGame,
  },
  {
    id: 'flappy',
    name: 'Flappy Bird',
    category: 'ARCADE',
    description: 'Atravesse obstáculos e bata seu recorde.',
    controls: 'ESPAÇO / TOQUE',
    Component: FlappyGame,
  },
  {
    id: 'solitaire',
    name: 'Paciência',
    category: 'CARTAS',
    description: 'Organize as cartas e complete as quatro bases.',
    controls: 'MOUSE / TOQUE',
    Component: SolitaireGame,
  },
  {
    id: 'doom',
    name: 'DOOM',
    category: 'RETRO FPS',
    description: 'Um FPS clássico executado diretamente no WS OS.',
    controls: 'TECLADO / MOUSE',
    Component: DoomGame,
  },
];

/* === Arte vetorial de cada jogo === */

function GameArtwork({ game }) {
  switch (game) {
    case 'snake':
      return (
        <svg viewBox="0 0 320 170" aria-hidden="true">
          <defs>
            <pattern id="games-snake-grid" width="23" height="23" patternUnits="userSpaceOnUse">
              <path d="M23 0H0V23" fill="none" stroke="currentColor" strokeOpacity=".11" />
            </pattern>
          </defs>
          <rect width="320" height="170" fill="url(#games-snake-grid)" />
          <path
            d="M46 119H92V96H138V73H184V50H230"
            fill="none"
            stroke="#2b8060"
            strokeWidth="22"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M46 119H92V96H138V73H184V50H230"
            fill="none"
            stroke="#83efb5"
            strokeWidth="15"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <rect x="229" y="39" width="24" height="23" rx="8" fill="#a8ffd0" />
          <circle cx="247" cy="46" r="3" fill="#123b30" />
          <circle cx="278" cy="49" r="10" fill="#ff746f" />
          <path d="M278 38l4-6" stroke="#8fdd9a" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'memory':
      return (
        <svg viewBox="0 0 320 170" aria-hidden="true">
          <g transform="translate(51 24)">
            {[
              [0, 0],
              [61, 0],
              [122, 0],
              [183, 0],
              [0, 62],
              [61, 62],
              [122, 62],
              [183, 62],
            ].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                <rect
                  width="49"
                  height="53"
                  rx="9"
                  fill={i === 2 || i === 5 ? '#b8a1ff' : '#29284d'}
                  stroke={i === 2 || i === 5 ? '#e1d5ff' : '#5e578f'}
                />
                {i === 2 || i === 5 ? (
                  <path d="M24.5 11L29 21l11 3-11 4-4.5 12-4.5-12-11-4 11-3z" fill="#3a2b76" />
                ) : (
                  <path
                    d="M17 15h15v23H17z"
                    fill="none"
                    stroke="#8d81cb"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                )}
              </g>
            ))}
          </g>
        </svg>
      );

    case 'mines':
      return (
        <svg viewBox="0 0 320 170" aria-hidden="true">
          <g transform="translate(74 12)">
            {Array.from({ length: 35 }, (_, i) => {
              const x = (i % 7) * 25;
              const y = Math.floor(i / 7) * 25;
              const revealed = [8, 9, 10, 15, 16, 17, 23, 24].includes(i);
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width="23"
                    height="23"
                    rx="3"
                    fill={revealed ? '#2d4b59' : '#173442'}
                    stroke="#4e7889"
                    strokeOpacity=".65"
                  />
                  {revealed && (
                    <text
                      x={x + 11.5}
                      y={y + 16}
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="bold"
                      fill={i % 2 ? '#9aceff' : '#c7e9cb'}
                    >
                      {i % 3 === 0 ? '2' : '1'}
                    </text>
                  )}
                </g>
              );
            })}
            <path d="M136 17v41" stroke="#edf2fb" strokeWidth="3" />
            <path d="M138 19l25 8-25 9z" fill="#ff777f" />
            <circle cx="36" cy="88" r="10" fill="#eac679" />
            <path d="M36 73v30M21 88h30M25 77l22 22M47 77L25 99" stroke="#eac679" strokeWidth="3" />
          </g>
        </svg>
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
              { x: 0, y: 20, r: -12, color: '#5576a8', suit: '♠', label: 'K' },
              { x: 63, y: 9, r: 5, color: '#cc687a', suit: '♥', label: 'Q' },
              { x: 126, y: 15, r: -5, color: '#5576a8', suit: '♣', label: 'J' },
            ].map((card, i) => (
              <g key={i} transform={`translate(${card.x} ${card.y}) rotate(${card.r} 45 66)`}>
                <rect width="90" height="132" rx="9" fill="#f6f3ed" stroke="#c8ced6" />
                <text x="12" y="24" fontSize="20" fontWeight="bold" fill={card.color}>
                  {card.label}
                </text>
                <text x="45" y="86" fontSize="48" textAnchor="middle" fill={card.color}>
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
            <linearGradient id="games-fps-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#471f2b" />
              <stop offset="1" stopColor="#a24c3d" />
            </linearGradient>
          </defs>
          <rect width="320" height="170" fill="url(#games-fps-sky)" />
          <circle cx="160" cy="57" r="46" fill="#e78e59" opacity=".65" />
          <path d="M0 92l45-33 38 26 54-43 48 37 54-30 81 48v73H0z" fill="#2b2633" />
          <path d="M0 120l95-31 65 39 72-42 88 34v50H0z" fill="#161b25" />
          <path d="M0 170L113 113h94l113 57" fill="#2e3037" />
          <path d="M112 170l26-52h44l26 52" fill="#4c4c50" />
          <path d="M149 139l11-18 11 18v31h-22z" fill="#858b86" />
          <path d="M160 67v19M150 76h20" stroke="#f2ddd0" strokeWidth="1.5" opacity=".8" />
        </svg>
      );

    default:
      return null;
  }
}

/* === DOOM / Freedoom WebAssembly === */
function DoomGame({ iframeRef }) {
  const accessibility = useAccessibility();
  /* ----- Fixar a preferência na abertura evita recarregar uma partida em curso. ----- */
  const [noMelt] = useState(
    () =>
      accessibility.motion ||
      accessibility.lowEffects ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  return (
    <section className="ws-games__doom">
      <div className="ws-games__doom-info">
        <h3>DOOM / Freedoom</h3>
        <p>Freedoom Phase 1 · UZDoom · WebAssembly</p>
      </div>

      <div className="ws-games__doom-player">
        <iframe
          ref={iframeRef}
          title="UZDoom — Freedoom"
          src={`${import.meta.env.BASE_URL}games/uzdoom/index.html?iwad=freedoom1.wad${noMelt ? '&nomelt=1' : ''}`}
          allow="cross-origin-isolated; autoplay; fullscreen; gamepad"
          referrerPolicy="same-origin"
        />
      </div>

      <p className="ws-games__doom-controls">
        {t(
          'Setas para movimentação · Ctrl para atirar · Espaço para interagir · Esc para o menu do jogo',
        )}
      </p>

      <p className="ws-games__doom-credit">
        {t(
          'Freedoom é um projeto independente de código e conteúdo livre. Não inclui os arquivos comerciais do Doom original.',
        )}
      </p>
      <a
        href={`${import.meta.env.BASE_URL}games/uzdoom/NOTICE.txt`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('Licenças dos jogos')} ↗
      </a>
    </section>
  );
}

/* === Aplicativo Jogos === */
export default function Games({ instance }) {
  useLocale();

  const [selected, setSelected] = useState(null);
  const paused = useGamePaused(instance);
  const {
    frameRef: doomFrameRef,
    saving: doomSaving,
    error: doomSaveError,
    synchronize,
  } = useDoomSession(instance?.id, selected === 'doom');

  async function leaveGame() {
    if (selected !== 'doom' || (await synchronize())) setSelected(null);
  }

  useAppBack(instance?.id, () => {
    if (!selected) return false;

    void leaveGame();

    return true;
  });

  const current = games.find((game) => game.id === selected);
  const Component = current?.Component;

  return (
    <article className="desktop-window__content ws-app ws-games">
      {Component ? (
        <div className="ws-games__play-view">
          <header className="ws-games__play-header">
            <button
              type="button"
              className="ws-games__back"
              onClick={() => void leaveGame()}
              disabled={doomSaving}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              {doomSaving ? t('Salvando...') : t('Voltar ao catálogo')}
            </button>
            <span className="ws-games__play-category">{t(current.category)}</span>
          </header>

          {doomSaveError && selected === 'doom' && (
            <p className="ws-games__doom-save-error" role="alert">
              {t(doomSaveError)}
            </p>
          )}

          <section className="ws-games__play-content">
            <Component paused={paused} iframeRef={doomFrameRef} />
            {['snake', 'flappy'].includes(selected) && (
              <GameRankings key={selected} game={selected} paused={paused} />
            )}
          </section>
        </div>
      ) : (
        <div className="ws-games__catalog">
          {/* === Apresentação no padrão V2 === */}
          <header className="ws-games__hero">
            <div className="ws-games__hero-text">
              <span className="ws-games__eyebrow">{t('WS OS / ENTERTAINMENT')}</span>
              <h2>{t('Jogos')}</h2>
              <p>
                {t(
                  'Clássicos para jogar diretamente no sistema. Escolha um título, desafie seus recordes e explore a biblioteca.',
                )}
              </p>
            </div>
            <div className="ws-games__hero-icon" aria-hidden="true">
              <Gamepad2 size={38} strokeWidth={1.45} />
            </div>
          </header>

          {/* === Resumo discreto === */}
          <div className="ws-games__overview">
            <div className="ws-games__overview-item">
              <Gamepad2 size={16} aria-hidden="true" />
              <strong>06</strong>
              <span>{t('JOGOS DISPONÍVEIS')}</span>
            </div>
            <div className="ws-games__overview-item">
              <Trophy size={16} aria-hidden="true" />
              <span>{t('RECORDES LOCAIS')}</span>
            </div>
            <div className="ws-games__overview-item">
              <Keyboard size={16} aria-hidden="true" />
              <span>{t('TECLADO E TOQUE')}</span>
            </div>
          </div>

          {/* === Biblioteca === */}
          <div className="ws-games__section-heading">
            <div>
              <span className="ws-games__section-eyebrow">{t('BIBLIOTECA / 01')}</span>
              <h3>{t('Explorar jogos')}</h3>
            </div>
            <span className="ws-games__section-count">{t('06 TÍTULOS')}</span>
          </div>

          <div className="ws-games__grid">
            {games.map((game, index) => {
              const available = Boolean(game.Component);

              return (
                <button
                  type="button"
                  key={game.id}
                  className={`ws-games__card ws-games__card--${game.id}`}
                  disabled={!available}
                  onClick={() => setSelected(game.id)}
                  aria-label={
                    available
                      ? `${t('Jogar')} ${t(game.name)}`
                      : `${t(game.name)} — ${t('Em preparação')}`
                  }
                >
                  <span className="ws-games__art">
                    <GameArtwork game={game.id} />
                    <span className="ws-games__art-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {!available && (
                      <span className="ws-games__art-pending">
                        <LockKeyhole size={12} aria-hidden="true" />
                        {t('EM PREPARAÇÃO')}
                      </span>
                    )}
                  </span>

                  <span className="ws-games__card-body">
                    <span className="ws-games__card-category">{t(game.category)}</span>
                    <strong className="ws-games__card-title">{t(game.name)}</strong>
                    <span className="ws-games__card-description">{t(game.description)}</span>
                    <span className="ws-games__card-footer">
                      <span>{t(game.controls)}</span>
                      {available ? (
                        <ArrowUpRight size={17} aria-hidden="true" />
                      ) : (
                        <LockKeyhole size={15} aria-hidden="true" />
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <footer className="ws-games__footer">
            {t(
              'Recordes locais permanecem neste navegador. Rankings públicos estão disponíveis nos jogos compatíveis.',
            )}
          </footer>
        </div>
      )}
    </article>
  );
}

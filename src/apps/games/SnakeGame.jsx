import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Trophy, Zap } from 'lucide-react';
import { FaJava } from 'react-icons/fa';
import { SiCss, SiDocker, SiGit, SiHtml5, SiJavascript, SiPython, SiSpring } from 'react-icons/si';

import { translate as t } from '../../shared/i18n/i18n';
import { newTechSnake, stepTechSnake } from './gameModels';
import { useGameRecord } from './gameRecords';

/* === Tecnologias originais da V1 === */

const TECHNOLOGIES = {
  java: { name: 'Java', Icon: FaJava, color: '#f89820' },
  javascript: { name: 'JavaScript', Icon: SiJavascript, color: '#f7df1e' },
  python: { name: 'Python', Icon: SiPython, color: '#3776ab' },
  html: { name: 'HTML', Icon: SiHtml5, color: '#e34f26' },
  css: { name: 'CSS', Icon: SiCss, color: '#1572b6' },
  docker: { name: 'Docker', Icon: SiDocker, color: '#2496ed' },
  git: { name: 'Git', Icon: SiGit, color: '#f05032' },
  spring: { name: 'Spring', Icon: SiSpring, color: '#6db33f' },
};

const KEYS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
};

const OPPOSITE = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

/* === Tabuleiro === */

function SnakeBoard({ state, onDirection, boardRef }) {
  const occupied = new Set(state.body.map((segment) => `${segment.x}:${segment.y}`));

  const head = state.body[0];
  const cellSize = 100 / state.size;

  function positionStyle(x, y) {
    return {
      left: `${x * cellSize}%`,
      top: `${y * cellSize}%`,
      width: `${cellSize}%`,
      height: `${cellSize}%`,
    };
  }

  return (
    <div
      ref={boardRef}
      className="ws-tech-snake__board"
      tabIndex={0}
      role="group"
      aria-label={t('Tabuleiro Snake. Use as setas ou WASD.')}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;

        const direction = KEYS[event.key] ?? KEYS[event.key.toLowerCase()];

        if (!direction) return;

        event.preventDefault();
        event.stopPropagation();

        if (!event.repeat) onDirection(direction);
      }}
    >
      <div className="ws-tech-snake__grid" aria-hidden="true" />

      {state.foods.map((food, index) => {
        const technology = TECHNOLOGIES[food.technology];
        if (!technology) return null;

        const Icon = technology.Icon;

        return (
          <div
            key={`food-${index}`}
            className="ws-tech-snake__food"
            style={{
              ...positionStyle(food.x, food.y),
              '--food-color': technology.color,
            }}
            title={technology.name}
            aria-hidden="true"
          >
            <span>
              <Icon />
            </span>
          </div>
        );
      })}

      {state.body.map((segment, index) => (
        <div
          key={`${segment.x}-${segment.y}-${index}`}
          className={[
            'ws-tech-snake__segment',
            index === 0 ? 'is-head' : '',
            index === state.body.length - 1 ? 'is-tail' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={positionStyle(segment.x, segment.y)}
          aria-hidden="true"
        >
          {index === 0 && <span className={`ws-tech-snake__eyes is-${state.direction}`} />}
        </div>
      ))}

      {state.over && (
        <div className="ws-tech-snake__overlay" role="status">
          <strong>{t(state.won ? 'Você venceu!' : 'Fim de jogo')}</strong>
          <span>
            {state.score} {t('Pontos')}
          </span>
        </div>
      )}

      <span className="ws-tech-snake__sr-only">
        {state.score} {t('Pontos')}. {t(`${state.foods.length} tecnologias disponíveis.`)}
        {t(`A cabeça da cobra está na posição ${head.x + 1}, ${head.y + 1}.`)}
        {t(`${occupied.size} casas ocupadas.`)}
      </span>
    </div>
  );
}

/* === Jogo === */

export default function SnakeGame({ paused = false }) {
  const [state, setState] = useState(() => newTechSnake());
  const [running, setRunning] = useState(false);

  const boardRef = useRef(null);
  const directionRef = useRef('right');
  const turnsRef = useRef([]);

  const { record, error } = useGameRecord('snake', state.score, state.over);

  const speed = Math.max(85, 165 - state.score * 3);
  const active = running && !paused && !state.over;

  /* === Movimentação e aceleração === */

  useEffect(() => {
    if (!active) return undefined;

    const timer = setInterval(() => {
      const requested = turnsRef.current.shift() ?? directionRef.current;

      directionRef.current = requested;

      setState((current) => stepTechSnake(current, requested, Math.random(), Math.random()));
    }, speed);

    return () => clearInterval(timer);
  }, [active, speed]);

  /* === Direções sem inversão imediata === */

  function steer(direction) {
    if (paused || state.over || !running) return;
    if (turnsRef.current.length >= 2) return;

    const previous = turnsRef.current.at(-1) ?? directionRef.current;

    if (direction === previous || direction === OPPOSITE[previous]) {
      return;
    }

    turnsRef.current.push(direction);
  }

  function startOrPause() {
    if (paused || state.over) return;

    setRunning((current) => !current);
    boardRef.current?.focus();
  }

  function restart() {
    if (paused) return;

    directionRef.current = 'right';
    turnsRef.current = [];

    setState(newTechSnake());
    setRunning(false);
    boardRef.current?.focus();
  }

  const status = state.over
    ? t(state.won ? 'Você venceu!' : 'Fim de jogo')
    : paused || !running
      ? t('Pausado')
      : t('Jogando');

  return (
    <section className="ws-tech-snake">
      {/* === Cabeçalho === */}
      <header className="ws-tech-snake__header">
        <div>
          <span className="ws-tech-snake__eyebrow">{t('ARCADE / CLASSIC')}</span>
          <h3>Snake</h3>
          <p>{t('Capture linguagens e tecnologias para crescer.')}</p>
        </div>

        <div className={`ws-tech-snake__status ${active ? 'is-active' : ''}`} role="status">
          <span />
          {status}
        </div>
      </header>

      {/* === Indicadores === */}
      <div className="ws-tech-snake__stats">
        <div className="ws-tech-snake__stat">
          <span>{t('Pontos')}</span>
          <strong>{state.score}</strong>
        </div>

        <div className="ws-tech-snake__stat">
          <span>
            <Trophy size={13} aria-hidden="true" />
            {t('Recorde local')}
          </span>
          <strong>{record ?? '—'}</strong>
        </div>

        <div className="ws-tech-snake__stat">
          <span>
            <Zap size={13} aria-hidden="true" />
            {t('VELOCIDADE')}
          </span>
          <strong>
            {Math.round(1000 / speed)} <small>{t('passos/s')}</small>
          </strong>
        </div>
      </div>

      {error && (
        <p className="ws-tech-snake__notice">{t('Recorde disponível somente nesta sessão.')}</p>
      )}

      {/* === Área de jogo === */}
      <div className="ws-tech-snake__layout">
        <div className="ws-tech-snake__board-column">
          <SnakeBoard state={state} boardRef={boardRef} onDirection={steer} />

          <div className="ws-tech-snake__board-caption">
            <span>20 × 20</span>
            <span>{t('02 TECNOLOGIAS POR VEZ')}</span>
          </div>
        </div>

        <aside className="ws-tech-snake__sidebar">
          <div className="ws-tech-snake__panel">
            <span className="ws-tech-snake__panel-label">{t('CONTROLES')}</span>

            <div className="ws-tech-snake__actions">
              <button type="button" onClick={startOrPause} disabled={paused || state.over}>
                {running && !state.over ? (
                  <Pause size={15} aria-hidden="true" />
                ) : (
                  <Play size={15} aria-hidden="true" />
                )}
                {t(running ? 'Pausar' : 'Iniciar')}
              </button>

              <button type="button" onClick={restart} disabled={paused}>
                <RotateCcw size={15} aria-hidden="true" />
                {t('Novo jogo')}
              </button>
            </div>

            <p className="ws-tech-snake__instructions">
              {t('Use as setas do teclado ou WASD para controlar a cobra.')}
            </p>

            <div className="ws-tech-snake__direction-pad">
              {[
                ['up', '↑', 'Mover para cima'],
                ['left', '←', 'Mover para esquerda'],
                ['down', '↓', 'Mover para baixo'],
                ['right', '→', 'Mover para direita'],
              ].map(([direction, symbol, label]) => (
                <button
                  type="button"
                  key={direction}
                  className={`is-${direction}`}
                  onClick={() => steer(direction)}
                  disabled={paused || state.over || !running}
                  aria-label={t(label)}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          <div className="ws-tech-snake__panel">
            <span className="ws-tech-snake__panel-label">{t('TECNOLOGIAS')}</span>

            <div className="ws-tech-snake__legend">
              {Object.entries(TECHNOLOGIES).map(([id, technology]) => {
                const Icon = technology.Icon;

                return (
                  <div key={id} title={technology.name}>
                    <Icon style={{ color: technology.color }} />
                    <span>{technology.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

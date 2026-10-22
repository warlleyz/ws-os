import { useEffect, useRef, useState } from 'react';
import { translate as t } from '../../shared/i18n/i18n';
import { newSnake, stepSnake } from './gameModels';
import { useGameRecord } from './gameRecords';
export default function SnakeGame({ paused }) {
  const [state, setState] = useState(() => newSnake(Math.random())),
    [running, setRunning] = useState(false);
  const direction = useRef('right');
  const turns = useRef([]);
  const { record, error } = useGameRecord('snake', state.score, state.over);
  useEffect(() => {
    if (!running || paused || state.over) return;
    const timer = setInterval(() => {
      const random = Math.random();
      const requested = turns.current.shift() ?? direction.current;
      direction.current = requested;
      setState((current) => stepSnake(current, requested, random));
    }, 150);
    return () => clearInterval(timer);
  }, [running, paused, state.over]);
  /* ----- Até duas curvas válidas, consumidas em passos separados ----- */
  function steer(value) {
    if (paused || state.over || turns.current.length >= 2) return;
    const previous = turns.current.at(-1) ?? direction.current;
    const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (value !== previous && value !== opposite[previous]) turns.current.push(value);
  }
  const body = new Set(state.body.map((cell) => cell.y * state.size + cell.x));
  const keys = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    s: 'down',
    a: 'left',
    d: 'right',
  };
  return (
    <section>
      <h3>Snake</h3>
      <p role="status">
        {t('Pontos')}: {state.score} · {t('Recorde local')}: {record ?? '—'}{' '}
        {state.won
          ? t('Você venceu!')
          : state.over
            ? t('Fim de jogo')
            : paused || !running
              ? t('Pausado')
              : ''}
      </p>
      {error && <p>{t('Recorde disponível somente nesta sessão.')}</p>}
      <div
        className="ws-snake"
        tabIndex={0}
        role="group"
        aria-label={t('Tabuleiro Snake. Use as setas ou WASD.')}
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          const value = keys[event.key] ?? keys[event.key.toLowerCase()];
          if (value) {
            event.preventDefault();
            event.stopPropagation();
            steer(value);
          }
        }}
      >
        {Array.from({ length: 225 }, (_, i) => (
          <span
            key={i}
            className={
              body.has(i)
                ? 'is-snake'
                : state.food && i === state.food.y * 15 + state.food.x
                  ? 'is-food'
                  : ''
            }
          />
        ))}
      </div>
      <div className="ws-app__toolbar">
        <button
          type="button"
          onClick={() => setRunning((value) => !value)}
          disabled={state.over || paused}
        >
          {t(running ? 'Pausar' : 'Iniciar')}
        </button>
        <button
          type="button"
          disabled={paused}
          onClick={() => {
            direction.current = 'right';
            turns.current = [];
            setState(newSnake(Math.random()));
            setRunning(false);
          }}
        >
          {t('Novo jogo')}
        </button>
        {[
          ['up', '↑'],
          ['left', '←'],
          ['down', '↓'],
          ['right', '→'],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            disabled={paused || state.over}
            aria-label={t(
              {
                up: 'Mover para cima',
                left: 'Mover para esquerda',
                down: 'Mover para baixo',
                right: 'Mover para direita',
              }[value],
            )}
            onClick={() => {
              steer(value);
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

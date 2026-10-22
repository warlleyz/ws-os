import { useEffect, useState } from 'react';
import { translate as t } from '../../shared/i18n/i18n';
import { newFlappy, stepFlappy } from './gameModels';
import { useGameRecord } from './gameRecords';
export default function FlappyGame({ paused }) {
  const [state, setState] = useState(newFlappy),
    [running, setRunning] = useState(false);
  const { record, error } = useGameRecord('flappy', state.score, state.over);
  useEffect(() => {
    if (!running || paused || state.over) return;
    let frame,
      last = null;
    function tick(time) {
      const delta = last === null ? 0 : (time - last) / 1000;
      last = time;
      const random = Math.random();
      setState((current) => stepFlappy(current, delta, random));
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, paused, state.over]);
  function jump() {
    if (paused || state.over) return;
    setRunning(true);
    setState((current) => (current.over ? current : { ...current, velocity: -0.42 }));
  }
  return (
    <section>
      <h3>Flappy Bird</h3>
      <p role="status">
        {t('Pontos')}: {state.score} · {t('Recorde local')}: {record ?? '—'}{' '}
        {state.over ? t('Fim de jogo') : paused || !running ? t('Pausado') : ''}
      </p>
      {error && <p>{t('Recorde disponível somente nesta sessão.')}</p>}
      <div
        tabIndex={0}
        role="group"
        aria-label={t('Jogo de voo. Pressione Espaço para saltar.')}
        onKeyDown={(event) => {
          if (event.code === 'Space' && !event.altKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            event.stopPropagation();
            if (!event.repeat) jump();
          }
        }}
      >
        <svg
          viewBox="0 0 320 400"
          className="ws-flappy"
          role="img"
          aria-label={t('Tabuleiro de voo')}
        >
          <rect width="320" height="400" fill="var(--surface-secondary)" />
          {state.pipes.map((pipe) => (
            <g key={pipe.id} fill="var(--accent-secondary)">
              <rect x={pipe.x * 320} width={0.12 * 320} height={(pipe.gap - 0.18) * 400} />
              <rect
                x={pipe.x * 320}
                y={(pipe.gap + 0.18) * 400}
                width={0.12 * 320}
                height={(1 - pipe.gap - 0.18) * 400}
              />
            </g>
          ))}
          <circle cx="64" cy={state.y * 400} r="10" fill="var(--status-warning)" />
        </svg>
      </div>
      <div className="ws-app__toolbar">
        <button type="button" onClick={jump} disabled={state.over || paused}>
          {t('Saltar')}
        </button>
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
            setState(newFlappy());
            setRunning(false);
          }}
        >
          {t('Novo jogo')}
        </button>
      </div>
    </section>
  );
}

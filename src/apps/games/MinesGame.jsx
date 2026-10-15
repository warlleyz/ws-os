import { useState } from 'react';
import { translate as t } from '../../shared/i18n/i18n';
import { newMinefield, revealMinefield, flagMinefield, mineNeighbors } from './gameModels';
import { useGameRecord } from './gameRecords';
export default function MinesGame({ paused }) {
  const [state, setState] = useState(null),
    [flag, setFlag] = useState(false),
    [seed, setSeed] = useState(() => Math.floor(Math.random() * 4294967296));
  const { record, error } = useGameRecord('mines', state?.moves ?? 0, state?.won === true);
  function reveal(index, mark = flag) {
    if (paused) return;
    setState((current) => {
      if (!current && mark) return current;
      const base = current ?? newMinefield(index, seed);
      return mark ? flagMinefield(base, index) : revealMinefield(base, index);
    });
  }
  return (
    <section>
      <h3>{t('Campo Minado')}</h3>
      <p role="status">
        {t('Bandeiras')}: {state?.flags.length ?? 0}/10 · {t('Melhor número de jogadas')}:{' '}
        {record ?? '—'} {state?.over ? t(state.won ? 'Você venceu!' : 'Fim de jogo') : ''}
      </p>
      {error && <p>{t('Recorde disponível somente nesta sessão.')}</p>}
      <label>
        {t('Modo bandeira')}
        <input
          type="checkbox"
          disabled={!state}
          checked={flag}
          onChange={(event) => setFlag(event.target.checked)}
        />
      </label>
      <div className="ws-mines">
        {Array.from({ length: 64 }, (_, index) => {
          const opened = state?.opened.includes(index),
            marked = state?.flags.includes(index),
            mine = state?.mines.includes(index),
            count = state
              ? mineNeighbors(index).filter((cell) => state.mines.includes(cell)).length
              : 0;
          return (
            <button
              key={index}
              type="button"
              disabled={paused || state?.over || opened}
              aria-label={`${t('Casa')} ${index + 1}${marked ? ` · ${t('Bandeira')}` : ''}${opened ? ` · ${count}` : ''}`}
              onClick={() => reveal(index)}
              onContextMenu={(event) => {
                event.preventDefault();
                reveal(index, true);
              }}
            >
              {marked ? '⚑' : opened ? count || '·' : state?.over && mine ? '✹' : ''}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          setState(null);
          setFlag(false);
          setSeed(Math.floor(Math.random() * 4294967296));
        }}
      >
        {t('Novo jogo')}
      </button>
      <p>
        {t('Primeira abertura segura. Use o modo bandeira ou clique direito para marcar minas.')}
      </p>
    </section>
  );
}

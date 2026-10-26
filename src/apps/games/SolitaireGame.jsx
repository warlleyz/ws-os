import { useState } from 'react';
import { translate as t } from '../../shared/i18n/i18n';
import { newSolitaire, drawSolitaire, moveSolitaire } from './gameModels';
import { useGameRecord } from './gameRecords';
const names = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
  suits = ['♠', '♥', '♣', '♦'];
const label = (card) => (card ? names[card.rank - 1] + suits[card.suit] : '—');
export default function SolitaireGame({ paused }) {
  const [state, setState] = useState(() => newSolitaire(Math.floor(Math.random() * 4294967296))),
    [selection, setSelection] = useState(null),
    [undo, setUndo] = useState([]),
    [message, setMessage] = useState('');
  const won = state.foundations.every((pile) => pile.length === 13);
  const { record, error } = useGameRecord('solitaire', state.moves, won);
  function apply(next) {
    if (paused || won || !next || next === state) return;
    setUndo((current) => [...current, state].slice(-20));
    setState(next);
    setSelection(null);
    setMessage('');
  }
  function pick(from) {
    if (paused || won) return;
    if (selection) {
      const to = from.kind === 'waste' ? null : { kind: from.kind, column: from.column };
      const next = moveSolitaire(state, selection, to);
      if (next) {
        apply(next);
        return;
      }
      setMessage('Movimento inválido. Escolha outra carta ou destino.');
    }
    setSelection(from);
  }
  return (
    <section className="ws-game ws-game--solitaire">
      <h3>{t('Paciência')}</h3>
      <p role="status">
        {t('Jogadas')}: {state.moves} · {t('Melhor número de jogadas')}: {record ?? '—'}{' '}
        {won ? t('Você venceu!') : paused ? t('Pausado') : ''} {t(message)}
      </p>
      {error && <p>{t('Recorde disponível somente nesta sessão.')}</p>}
      <p>
        {t(
          'Klondike: compre uma carta. Selecione uma carta e depois o destino. Sequências alternam cores; espaços vazios recebem reis. Bases começam com ases.',
        )}
      </p>
      <div className="ws-app__toolbar">
        <button type="button" disabled={paused || won} onClick={() => apply(drawSolitaire(state))}>
          {t(state.stock.length ? 'Comprar carta' : 'Reciclar monte')} ({state.stock.length})
        </button>
        <button
          type="button"
          aria-pressed={selection?.kind === 'waste'}
          disabled={paused || won || !state.waste.length}
          onClick={() => pick({ kind: 'waste' })}
        >
          {t('Descarte')}: {label(state.waste.at(-1))}
        </button>
        {state.foundations.map((pile, column) => (
          <button
            type="button"
            key={column}
            disabled={paused || won}
            onClick={() => pick({ kind: 'foundation', column })}
          >
            {t('Base')} {suits[column]}: {label(pile.at(-1))}
          </button>
        ))}
      </div>
      <div className="ws-solitaire">
        {state.tableau.map((pile, column) => (
          <div key={column} className="ws-solitaire__column">
            <button
              type="button"
              disabled={paused || won}
              onClick={() => {
                if (!selection) {
                  setMessage('Selecione uma carta primeiro.');
                  return;
                }
                const next = moveSolitaire(state, selection, { kind: 'tableau', column });
                if (next) apply(next);
                else setMessage('Movimento inválido. Escolha outra carta ou destino.');
              }}
            >
              {t('Coluna')} {column + 1}
            </button>
            {pile.map((card, index) => (
              <button
                className={card.suit % 2 ? 'is-red' : ''}
                key={card.id}
                type="button"
                disabled={!card.faceUp || paused || won}
                aria-pressed={
                  selection?.kind === 'tableau' &&
                  selection.column === column &&
                  selection.index === index
                }
                onClick={() => pick({ kind: 'tableau', column, index })}
              >
                {card.faceUp ? label(card) : '▧'}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="ws-app__toolbar">
        <button
          type="button"
          disabled={paused}
          onClick={() => {
            setSelection(null);
            setMessage('');
          }}
        >
          {t('Cancelar seleção')}
        </button>
        <button
          type="button"
          disabled={paused || !undo.length}
          onClick={() => {
            setMessage('');
            setState(undo.at(-1));
            setUndo((current) => current.slice(0, -1));
            setSelection(null);
          }}
        >
          {t('Desfazer')}
        </button>
        <button
          type="button"
          disabled={paused}
          onClick={() => {
            setMessage('');
            setState(newSolitaire(Math.floor(Math.random() * 4294967296)));
            setUndo([]);
            setSelection(null);
          }}
        >
          {t('Novo jogo')}
        </button>
      </div>
    </section>
  );
}

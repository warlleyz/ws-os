import { useEffect, useState } from 'react';
import { translate as t } from '../../shared/i18n/i18n';
import { shuffled } from './gameModels';
import { useGameRecord } from './gameRecords';
const deck = () =>
  shuffled(
    Array.from({ length: 16 }, (_, i) => (i % 8) + 1),
    Math.floor(Math.random() * 4294967296),
  );
export default function MemoryGame({ paused }) {
  const [cards, setCards] = useState(deck),
    [flipped, setFlipped] = useState([]),
    [matched, setMatched] = useState([]),
    [moves, setMoves] = useState(0);
  const { record, error } = useGameRecord('memory', moves, matched.length === 16);
  useEffect(() => {
    if (flipped.length !== 2 || paused) return;
    const timer = setTimeout(() => setFlipped([]), 700);
    return () => clearTimeout(timer);
  }, [flipped, paused]);
  function flip(index) {
    if (paused || flipped.length === 2 || flipped.includes(index) || matched.includes(index))
      return;
    const next = [...flipped, index];
    if (next.length === 2) {
      setMoves((value) => value + 1);
      if (cards[next[0]] === cards[next[1]]) {
        setMatched((current) => [...current, ...next]);
        setFlipped([]);
        return;
      }
    }
    setFlipped(next);
  }
  return (
    <section className="ws-game ws-game--memory">
      <h3>{t('Memória')}</h3>
      <p role="status">
        {t('Tentativas')}: {moves} · {t('Melhor número de tentativas')}: {record ?? '—'}{' '}
        {matched.length === 16 ? t('Você venceu!') : paused ? t('Pausado') : ''}
      </p>
      {error && <p>{t('Recorde disponível somente nesta sessão.')}</p>}
      <div className="ws-memory">
        {cards.map((value, index) => {
          const shown = flipped.includes(index) || matched.includes(index);
          return (
            <button
              key={index}
              className={matched.includes(index) ? 'is-matched' : shown ? 'is-revealed' : ''}
              aria-pressed={shown}
              type="button"
              disabled={paused || matched.includes(index) || flipped.length === 2}
              aria-label={shown ? `${t('Carta')} ${value}` : `${t('Carta fechada')} ${index + 1}`}
              onClick={() => flip(index)}
            >
              {shown ? value : '?'}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={paused}
        onClick={() => {
          setCards(deck());
          setFlipped([]);
          setMatched([]);
          setMoves(0);
        }}
      >
        {t('Novo jogo')}
      </button>
    </section>
  );
}

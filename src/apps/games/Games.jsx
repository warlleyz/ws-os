import GameRankings from './GameRankings';
import { useState } from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import useAppBack from '../../shared/hooks/useAppBack';
import { useGamePaused } from './gameRecords';
import SnakeGame from './SnakeGame';
import MemoryGame from './MemoryGame';
import MinesGame from './MinesGame';
import FlappyGame from './FlappyGame';
import SolitaireGame from './SolitaireGame';
import '../../styles/apps.css';
import './Games.css';
const games = [
  { id: 'snake', name: 'Snake', Component: SnakeGame },
  { id: 'memory', name: 'Memória', Component: MemoryGame },
  { id: 'mines', name: 'Campo Minado', Component: MinesGame },
  { id: 'flappy', name: 'Flappy Bird', Component: FlappyGame },
  { id: 'solitaire', name: 'Paciência', Component: SolitaireGame },
];
export default function Games({ instance }) {
  useLocale();
  const [selected, setSelected] = useState(null);
  const paused = useGamePaused(instance);
  useAppBack(instance?.id, () => {
    if (!selected) return false;
    setSelected(null);
    return true;
  });
  const current = games.find((item) => item.id === selected),
    Component = current?.Component;
  return (
    <article className="desktop-window__content ws-app">
      <h2>{t('Jogos')}</h2>
      <p>
        {t(
          'Recordes locais são salvos neste navegador. Rankings públicos dependem de configuração e envio voluntário.',
        )}
      </p>
      {Component ? (
        <>
          <button type="button" onClick={() => setSelected(null)}>
            {t('Voltar ao catálogo')}
          </button>
          <Component paused={paused} />
          {['snake', 'flappy'].includes(selected) && (
            <GameRankings key={selected} game={selected} paused={paused} />
          )}
        </>
      ) : (
        <>
          <div className="ws-app__grid">
            {games.map((item) => (
              <section className="ws-app__card" key={item.id}>
                <h3>{t(item.name)}</h3>
                <button type="button" onClick={() => setSelected(item.id)}>
                  {t('Jogar')}
                </button>
              </section>
            ))}
          </div>
          <p>{t('DOOM depende de licença e distribuição autorizadas; não está incluído.')}</p>
        </>
      )}
    </article>
  );
}

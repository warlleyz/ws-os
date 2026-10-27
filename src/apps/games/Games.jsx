import { useState } from 'react';

import { useLocale } from '../../shared/i18n/i18n';
import useAppBack from '../../shared/hooks/useAppBack';

import { GAMES_CATALOG } from './catalog/gameDefinitions';
import GamesCatalog from './catalog/GamesCatalog';
import GameLayout from './components/GameLayout';

import SnakeGame from './snake/SnakeGame';

import '../../styles/apps.css';
import './Games.css';

/* === REGISTRO DOS JOGOS === */
const GAME_COMPONENTS = {
  snake: SnakeGame,
};  

/* === APLICATIVO JOGOS === */
export default function Games({ instance }) {
  useLocale();

  /* ----- NAVEGAÇÃO ----- */
  const [selected, setSelected] = useState(null);

  /* ----- JOGO SELECIONADO ----- */
  const current = GAMES_CATALOG.find(
    (game) => game.id === selected,
  );

  const Component = current
    ? GAME_COMPONENTS[current.id]
    : null;

  /* === RETORNO AO CATÁLOGO === */
  function leaveGame() {
    setSelected(null);
  }

  /* === NAVEGAÇÃO DO SISTEMA === */
  useAppBack(instance?.id, () => {
    if (!selected) {
      return false;
    }

    leaveGame();

    return true;
  });

  /* === INTERFACE DO APLICATIVO === */
  return (
    <article className="desktop-window__content ws-app ws-games">
      {current && Component ? (
        <GameLayout
          game={current}
          Component={Component}
          onBack={leaveGame}
        />
      ) : (
        <GamesCatalog
          availableGames={Object.keys(GAME_COMPONENTS)}
          onSelect={setSelected}
        />
      )}
    </article>
  );
}
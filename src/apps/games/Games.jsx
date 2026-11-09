import { useEffect, useRef, useState } from 'react';

import { useLocale } from '../../shared/i18n/i18n';
import useAppBack from '../../shared/hooks/useAppBack';

import {
  GAMES_CATALOG,
  GAMES_CATALOG_WINDOW,
} from './catalog/gameDefinitions';
import GamesCatalog from './catalog/GamesCatalog';
import GameLayout from './components/GameLayout';
import useGamePaused from './shared/useGamePaused';

import SnakeGame from './snake/SnakeGame';
import MemoryGame from './memory/MemoryGame';
import MinesGame from './mines/MinesGame';
import FlappyGame from './flappy/FlappyGame';
import SolitaireGame from './solitaire/SolitaireGame';

import '../../styles/apps.css';
import './Games.css';

/* === REGISTRO DOS JOGOS === */
const GAME_COMPONENTS = {
  snake: SnakeGame,
  memory: MemoryGame,
  mines: MinesGame,
  flappy: FlappyGame,
  solitaire: SolitaireGame,
};

/* === APLICATIVO JOGOS === */
export default function Games({ instance, onWindowResize }) {
  useLocale();

  /* ----- ESTADO DE EXECUÇÃO ----- */
  const paused = useGamePaused(instance);

  /* ----- NAVEGAÇÃO ----- */
  const [selected, setSelected] = useState(null);
  const rootRef = useRef(null);
  const resizeRef = useRef(onWindowResize);

  useEffect(() => { resizeRef.current = onWindowResize; }, [onWindowResize]);

  /* === ENQUADRAMENTO DA JANELA APÓS A MONTAGEM === */
  useEffect(() => {
    const root = rootRef.current;
    const content = root?.querySelector('.ws-games__play-content');
    const desktopWindow = root?.closest('.desktop-window');
    if (!selected || !content || !desktopWindow || !resizeRef.current) return;
    let frame = 0, lastHeight = 0;
    function fit() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (desktopWindow.matches('.desktop-window--maximized, .desktop-window--left, .desktop-window--right')) return;
        const overflow = content.scrollHeight - content.clientHeight;
        if (overflow <= 2) return;
        const height = Math.ceil(desktopWindow.getBoundingClientRect().height + overflow + 2);
        if (height === lastHeight) return;
        lastHeight = height;
        resizeRef.current?.({ width: GAMES_CATALOG.find((game) => game.id === selected).window.width, height });
      });
    }
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    observer?.observe(content);
    if (content.firstElementChild) observer?.observe(content.firstElementChild);
    fit();
    return () => { observer?.disconnect(); window.cancelAnimationFrame(frame); };
  }, [selected]);

  /* ----- JOGO SELECIONADO ----- */
  const current = GAMES_CATALOG.find(
    (game) => game.id === selected,
  );

  const Component = current
    ? GAME_COMPONENTS[current.id]
    : null;

  /* === SELEÇÃO DO JOGO === */
  function openGame(gameId) {
    const game = GAMES_CATALOG.find(
      (item) => item.id === gameId,
    );

    if (!game || !GAME_COMPONENTS[gameId]) {
      return;
    }

    setSelected(gameId);
    onWindowResize?.(game.window ?? GAMES_CATALOG_WINDOW);
  }

  /* === RETORNO AO CATÁLOGO === */
  function leaveGame() {
    setSelected(null);
    onWindowResize?.(GAMES_CATALOG_WINDOW);
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
    <article className="desktop-window__content ws-app ws-games" ref={rootRef}>
      {current && Component ? (
        <GameLayout
          game={current}
          Component={Component}
          paused={paused}
          onBack={leaveGame}
        />
      ) : (
        <GamesCatalog
          availableGames={Object.keys(GAME_COMPONENTS)}
          onSelect={openGame}
        />
      )}
    </article>
  );
}

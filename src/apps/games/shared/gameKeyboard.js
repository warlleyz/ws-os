/* === ISOLAMENTO DOS ATALHOS DOS JOGOS === */
export function canHandleGameKey(event, board, paused) {
    if (
        paused || event.defaultPrevented || event.repeat || event.isComposing ||
        event.ctrlKey || event.altKey || event.metaKey
    ) return false;

    const desktopWindow = board?.closest('.desktop-window');
    if (desktopWindow && !desktopWindow.classList.contains('desktop-window--active'))
        return false;

    const target = event.target;
    if (target?.isContentEditable || target?.closest?.(
        'input, textarea, select, button, a[href], [role="button"], [role="dialog"], [role="menu"]',
    )) return false;

    const playView = board?.closest('.ws-games__play-view');
    if (playView && target && target !== board.ownerDocument?.body && !playView.contains(target))
        return false;

    return true;
}

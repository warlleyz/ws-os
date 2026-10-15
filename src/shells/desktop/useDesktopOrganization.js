import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getRegisteredApps } from '../../core/appRegistry';
import { useSystem } from '../../core/useSystem';
import {
  DEFAULT_SHORTCUT_ORDER,
  loadDesktopPreferences,
  saveDesktopPreferences,
} from './desktopPreferences';
import {
  clampDesktopDrag,
  getCellColumn,
  getCellRow,
  getShortcutsInArea,
  moveDesktopShortcuts,
} from './desktopLayout';

export default function useDesktopOrganization({ shortcutsRef, gridSize }) {
  const locale = useLocale();
  const { notify } = useSystem();
  const [initial] = useState(loadDesktopPreferences);
  const [preferences, setPreferences] = useState(initial);
  const [selectedIds, setSelectedIds] = useState([]);
  const selectionAnchorRef = useRef(null);
  const dragRef = useRef(null);
  const selectionBoxRef = useRef(null);
  const suppressClickRef = useRef(false);
  const clickTimerRef = useRef(null);
  const warningRef = useRef(false);
  const shortcuts = useMemo(() => {
    const apps = getRegisteredApps().filter(
      (app) => app.desktopShortcut && DEFAULT_SHORTCUT_ORDER.includes(app.id),
    );
    return apps.sort(
      preferences.order === 'name'
        ? (a, b) => t(a.name).localeCompare(t(b.name), locale)
        : (a, b) => DEFAULT_SHORTCUT_ORDER.indexOf(a.id) - DEFAULT_SHORTCUT_ORDER.indexOf(b.id),
    );
  }, [preferences.order, locale]);
  useEffect(() => {
    const failed =
      preferences === initial && initial.error ? true : !saveDesktopPreferences(preferences);
    if (!failed) {
      warningRef.current = false;
      return;
    }
    if (warningRef.current) return;
    warningRef.current = true;
    notify({
      title: 'Preferências da área de trabalho',
      message:
        'Não foi possível ler ou salvar toda a organização. Você pode continuar usando a sessão; as alterações podem não permanecer após recarregar.',
      source: 'Desktop',
      type: 'warning',
    });
  }, [preferences, initial, notify]);

  const clearDrag = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    for (const element of drag?.elements ?? []) {
      element.style.translate = '';
      delete element.dataset.dropValid;
    }
    if (selectionBoxRef.current) selectionBoxRef.current.hidden = true;
    if (drag?.target.hasPointerCapture?.(drag.pointerId))
      drag.target.releasePointerCapture(drag.pointerId);
    return drag;
  }, []);
  useEffect(
    () => () => {
      clearDrag();
    },
    [gridSize.width, gridSize.height, clearDrag],
  );
  useEffect(
    () => () => {
      window.clearTimeout(clickTimerRef.current);
    },
    [],
  );

  function warnBlocked() {
    notify({
      title: 'Posição indisponível',
      message:
        'Escolha células livres da grade, sem sobrepor atalhos, relógio ou barra de tarefas.',
      source: 'Desktop',
      type: 'warning',
    });
  }
  function select(id, event = {}) {
    let next;
    if (event.shiftKey && selectionAnchorRef.current) {
      const a = shortcuts.findIndex((app) => app.id === selectionAnchorRef.current);
      const b = shortcuts.findIndex((app) => app.id === id);
      next = shortcuts.slice(Math.min(a, b), Math.max(a, b) + 1).map((app) => app.id);
    } else if (event.ctrlKey || event.metaKey) {
      next = selectedIds.includes(id)
        ? selectedIds.filter((value) => value !== id)
        : [...selectedIds, id];
    } else next = [id];
    if (!event.shiftKey) selectionAnchorRef.current = id;
    setSelectedIds(next);
    return next;
  }
  function sort(order) {
    clearDrag();
    setPreferences({ order, positions: {}, error: null });
  }
  function startShortcutDrag(event, appId, index, layout) {
    if (event.button !== 0 || !layout.shortcuts[index]) return;
    const ids =
      selectedIds.includes(appId) && !event.ctrlKey && !event.metaKey && !event.shiftKey
        ? selectedIds
        : select(appId, event);
    if (!ids.includes(appId)) return;
    const elements = Array.from(shortcutsRef.current.querySelectorAll('[data-app-id]')).filter(
      (element) => ids.includes(element.dataset.appId),
    );

    const selectedPositions = shortcuts
      .map((app, shortcutIndex) =>
        ids.includes(app.id)
          ? layout.shortcuts[shortcutIndex]
          : null,
      )
      .filter(Boolean);

    const bounds = {
      left: Math.min(...selectedPositions.map((p) => p.left)),
      top: Math.min(...selectedPositions.map((p) => p.top)),
      right: Math.max(
        ...selectedPositions.map((p) => p.left + 82),
      ),
      bottom: Math.max(
        ...selectedPositions.map((p) => p.top + 82),
      ),
    };

    dragRef.current = {
      type: 'shortcuts',
      target: event.currentTarget,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      appId,
      ids,
      elements,
      layout,
      layout,
      bounds,
      initialPosition: layout.shortcuts[index],
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function startAreaSelection(event, layout) {
    if (event.button !== 0 || event.pointerType === 'touch' || event.target !== event.currentTarget)
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    const initialIds = selectedIds;
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey) setSelectedIds([]);
    dragRef.current = {
      type: 'area',
      target: event.currentTarget,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      rect,
      layout,
      initialIds,
      additive: event.ctrlKey || event.metaKey || event.shiftKey,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePointer(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (drag.type === 'area') {
      const area = {
        left: Math.min(drag.x, event.clientX) - drag.rect.left,
        top: Math.min(drag.y, event.clientY) - drag.rect.top,
        width: Math.abs(dx),
        height: Math.abs(dy),
      };
      const box = selectionBoxRef.current;
      if (box) {
        box.hidden = false;
        Object.assign(box.style, {
          left: `${area.left}px`,
          top: `${area.top}px`,
          width: `${area.width}px`,
          height: `${area.height}px`,
        });
      }
      const ids = [
        ...new Set([
          ...(drag.additive ? drag.initialIds : []),
          ...getShortcutsInArea(shortcuts, drag.layout.shortcuts, area),
        ]),
      ];
      setSelectedIds((current) =>
        current.length === ids.length && current.every((id) => ids.includes(id)) ? current : ids,
      );
      return;
    }

    if (!drag.moved && Math.hypot(dx, dy) < 6) return;

    drag.moved = true;

    const limited = clampDesktopDrag(
      dx,
      dy,
      drag.bounds,
      drag.layout,
    );

    const column = getCellColumn(
      drag.initialPosition.left + limited.dx,
      drag.layout,
    );

    const row = getCellRow(
      drag.initialPosition.top + limited.dy,
    );

    drag.candidate = moveDesktopShortcuts(
      shortcuts,
      drag.layout,
      drag.ids,
      drag.appId,
      column,
      row,
    );

    for (const element of drag.elements) {
      element.style.setProperty(
        'translate',
        `${limited.dx}px ${limited.dy}px`,
      );

      element.setAttribute(
        'data-drop-valid',
        String(Boolean(drag.candidate)),
      );
    }
  }
  function finishPointer(event) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    const drag = clearDrag();
    if (drag.type === 'area') {
      if (event.type !== 'pointerup') setSelectedIds(drag.initialIds);
      return;
    }
    if (!drag.moved || event.type !== 'pointerup') return;
    suppressClickRef.current = true;
    window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
    if (!drag.candidate) {
      warnBlocked();
      return;
    }
    setPreferences((current) => ({ ...current, positions: drag.candidate, error: null }));
  }
  function handleClick(event, id) {
    if (suppressClickRef.current) return;
    if (event.detail === 0 || (!event.ctrlKey && !event.metaKey && !event.shiftKey))
      select(id, event);
  }
  function handleKeyDown(event, app, index, layout, open) {
    const directions = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      setSelectedIds(shortcuts.map((item) => item.id));
      return;
    }
    if (event.key === 'Escape') {
      clearDrag();
      setSelectedIds([]);
      return;
    }
    if (event.altKey && directions[event.key]) {
      event.preventDefault();
      const position = layout.shortcuts[index];
      const [dx, dy] = directions[event.key];
      const ids = selectedIds.includes(app.id) ? selectedIds : [app.id];
      let column = getCellColumn(position.left, layout) + dx;
      let row = getCellRow(position.top) + dy;
      let candidate = null;
      while (column >= 0 && row >= 0 && column < layout.columns && row < layout.rows) {
        candidate = moveDesktopShortcuts(shortcuts, layout, ids, app.id, column, row);
        if (candidate) break;
        column += dx;
        row += dy;
      }
      if (candidate) {
        setSelectedIds(ids);
        setPreferences((current) => ({ ...current, positions: candidate, error: null }));
      } else warnBlocked();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(app.id);
      open(app.id);
    } else if (event.key === ' ') {
      event.preventDefault();
      select(app.id, event);
    }
  }
  return {
    shortcuts,
    shortcutOrder: preferences.order,
    shortcutPositions: preferences.positions,
    selectedIds,
    setSelectedIds,
    select,
    sort,
    startShortcutDrag,
    startAreaSelection,
    movePointer,
    finishPointer,
    handleClick,
    handleKeyDown,
    selectionBoxRef,
    clearDrag,
    suppressClickRef,
  };
}

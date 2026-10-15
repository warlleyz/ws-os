
import { useCallback, useEffect, useRef, useState } from 'react';

export default function useDesktopLayout() {
  const [gridSize, setGridSize] = useState({
    width: 0,
    height: 0,
  });

  const shortcutsRef = useRef(null);
  const workspaceRef = useRef(null);

  const refreshLayout = useCallback(() => {
    const workspace = workspaceRef.current;

    if (!workspace) return;

    const width = Math.round(
      shortcutsRef.current?.clientWidth ?? workspace.clientWidth,
    );

    const height = Math.max(
      0,
      Math.round(workspace.clientHeight) - 38,
    );

    // Atualização explícita, inclusive quando as dimensões
    // não mudaram. Não altera as preferências salvas.
    setGridSize({ width, height });
  }, []);

  useEffect(() => {
    const workspace = workspaceRef.current;

    if (!workspace) return;

    const observer = new ResizeObserver(() => {
      const width = Math.round(
        shortcutsRef.current?.clientWidth ?? workspace.clientWidth,
      );

      const height = Math.max(
        0,
        Math.round(workspace.clientHeight) - 38,
      );

      setGridSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    });

    observer.observe(workspace);
    refreshLayout();

    return () => observer.disconnect();
  }, [refreshLayout]);

  return {
    gridSize,
    shortcutsRef,
    workspaceRef,
    refreshLayout,
  };
}

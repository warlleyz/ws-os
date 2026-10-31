import { useCallback, useEffect, useRef, useState } from 'react';

/* === Gerenciamento do layout do Desktop === */
export default function useDesktopLayout() {

  /* ----- Estado da grade ----- */
  const [gridSize, setGridSize] = useState({
    width: 0,
    height: 0,
  });

  /* ----- Referências dos elementos ----- */
  const shortcutsRef = useRef(null);
  const workspaceRef = useRef(null);

  /* === Dimensões do Desktop === */
  /* ----- Calcular dimensões disponíveis ----- */
  const measureLayout = useCallback(() => {
    const workspace = workspaceRef.current;

    if (!workspace) return null;

    return {
      width: Math.round(
        shortcutsRef.current?.clientWidth ?? workspace.clientWidth,
      ),
      height: Math.max(
        0,
        Math.round(workspace.clientHeight) - 38,
      ),
    };
  }, []);

  /* ----- Atualizar dimensões manualmente ----- */
  const refreshLayout = useCallback(() => {
    const dimensions = measureLayout();

    if (!dimensions) return;

    setGridSize(dimensions);
  }, [measureLayout]);

  /* === Observação de redimensionamento === */
  /* ----- Monitorar alterações da área de trabalho ----- */
  useEffect(() => {
    const workspace = workspaceRef.current;

    if (!workspace) return;

    const observer = new ResizeObserver(() => {
      const dimensions = measureLayout();

      if (!dimensions) return;

      setGridSize((current) =>
        current.width === dimensions.width &&
          current.height === dimensions.height
          ? current
          : dimensions,
      );
    });

    observer.observe(workspace);
    refreshLayout();

    return () => observer.disconnect();
  }, [measureLayout, refreshLayout]);

  /* === Interface do hook === */
  return {
    gridSize,
    shortcutsRef,
    workspaceRef,
    refreshLayout,
  };
}
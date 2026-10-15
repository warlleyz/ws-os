import { useEffect, useRef, useState } from 'react';
export default function useDesktopLayout() {
  const [gridSize, setGridSize] = useState({
    width: 0,
    height: 0,
  });
  const shortcutsRef = useRef(null);
  const workspaceRef = useRef(null);
  useEffect(() => {
    const element = workspaceRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(shortcutsRef.current?.clientWidth ?? entry.contentRect.width);
      const height = Math.max(0, Math.round(entry.contentRect.height) - 38);
      setGridSize((current) =>
        current.width === width && current.height === height
          ? current
          : {
              width,
              height,
            },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { gridSize, shortcutsRef, workspaceRef };
}

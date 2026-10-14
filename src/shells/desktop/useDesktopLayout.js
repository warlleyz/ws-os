import { useEffect, useRef, useState } from 'react';
export default function useDesktopLayout() {
  const [gridSize, setGridSize] = useState({
    width: 0,
    height: 0,
  });
  const shortcutsRef = useRef(null);
  useEffect(() => {
    const element = shortcutsRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
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
  return { gridSize, shortcutsRef };
}

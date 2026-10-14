import { useEffect, useRef, useState } from 'react';
// Utilitários e preferências persistentes do WS Menu.
export default function useTaskbarScroll({ groups }) {
  const appsScrollRef = useRef(null);
  const [appsScroll, setAppsScroll] = useState({
    overflow: false,
    left: false,
    right: false,
  });
  // Detecta excesso de aplicativos e mantém a navegação atualizada.
  useEffect(() => {
    const element = appsScrollRef.current;
    if (!element) return;
    const update = () => {
      const maxScroll = element.scrollWidth - element.clientWidth;
      const next = {
        overflow: maxScroll > 1,
        left: element.scrollLeft > 1,
        right: element.scrollLeft < maxScroll - 1,
      };
      setAppsScroll((current) =>
        current.overflow === next.overflow &&
        current.left === next.left &&
        current.right === next.right
          ? current
          : next,
      );
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) {
      observer.observe(element.firstElementChild);
    }
    const frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [groups.length]);
  function scrollApps(direction) {
    appsScrollRef.current?.scrollBy({
      left: direction * 164,
      behavior: 'smooth',
    });
  }
  return {
    appsScrollRef,
    appsScroll,
    setAppsScroll,
    scrollApps,
  };
}

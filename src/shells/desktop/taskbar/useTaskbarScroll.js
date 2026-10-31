import { useEffect, useRef, useState } from 'react';

/* === Gerenciamento da rolagem da Taskbar === */
export default function useTaskbarScroll({ groups }) {

  /* === Referências e estados === */
  /* ----- Área de aplicativos ----- */
  const appsScrollRef = useRef(null);

  /* ----- Disponibilidade da navegação ----- */
  const [appsScroll, setAppsScroll] = useState({
    overflow: false,
    left: false,
    right: false,
  });

  /* === Monitoramento da área de aplicativos === */
  useEffect(() => {
    const element = appsScrollRef.current;

    if (!element) return;

    /* ----- Atualizar disponibilidade da rolagem ----- */
    const update = () => {
      const maxScroll =
        element.scrollWidth - element.clientWidth;

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

    /* ----- Observar alterações de dimensão ----- */
    const observer = new ResizeObserver(update);

    observer.observe(element);

    if (element.firstElementChild) {
      observer.observe(element.firstElementChild);
    }

    /* ----- Atualização inicial ----- */
    const frame = requestAnimationFrame(update);

    /* ----- Limpeza dos recursos ----- */
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [groups.length]);

  /* === Navegação horizontal === */
  /* ----- Rolar aplicativos ----- */
  function scrollApps(direction) {
    appsScrollRef.current?.scrollBy({
      left: direction * 164,
      behavior: 'smooth',
    });
  }

  /* === Interface do hook === */
  return {
    appsScrollRef,
    appsScroll,
    setAppsScroll,
    scrollApps,
  };
}
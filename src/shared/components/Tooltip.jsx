import {
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { createPortal } from 'react-dom';

import './Tooltip.css';

/* === Configurações === */
/* ----- Temporização e posicionamento ----- */
const DEFAULT_DELAY = 450;
const GAP = 6;
const MARGIN = 8;
const POINTER_OFFSET_X = 12;
const POINTER_OFFSET_Y = 16;

/* === Utilitários de posicionamento === */
/* ----- Limitar valores à área visível ----- */
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

/* ----- Calcular posição do tooltip ----- */
function calculatePosition(trigger, tooltip, pointer) {
  const anchor = trigger.getBoundingClientRect();

  const width = tooltip.offsetWidth;
  const height = tooltip.offsetHeight;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left;
  let top;

  if (pointer) {
    /* ----- Posicionamento próximo ao ponteiro ----- */
    left = pointer.x + POINTER_OFFSET_X;
    top = pointer.y + POINTER_OFFSET_Y;

    if (left + width + MARGIN > viewportWidth) {
      left = pointer.x - width - POINTER_OFFSET_X;
    }

    if (top + height + MARGIN > viewportHeight) {
      top = pointer.y - height - POINTER_OFFSET_Y;
    }
  } else {
    /* ----- Posicionamento pelo foco do teclado ----- */
    left = anchor.left + anchor.width / 2 - width / 2;
    top = anchor.bottom + GAP;
  }

  return {
    left: clamp(left, MARGIN, Math.max(MARGIN, viewportWidth - width - MARGIN)),
    top: clamp(top, MARGIN, Math.max(MARGIN, viewportHeight - height - MARGIN)),
  };
}

/* === Componente Tooltip === */
export default function Tooltip({
  content,
  children,
  delay = DEFAULT_DELAY,
  disabled = false,
}) {
  /* ----- Identificação e referências ----- */
  const id = useId();

  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const pointerRef = useRef(null);
  const timerRef = useRef(null);

  /* ----- Estado de exibição ----- */
  const [visible, setVisible] = useState(false);

  const [position, setPosition] = useState({
    left: 0,
    top: 0,
  });

  /* === Controle de temporização === */
  /* ----- Cancelar abertura agendada ----- */
  const clearTimer = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  /* ----- Ocultar tooltip ----- */
  const hide = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  /* ----- Exibir após atraso ----- */
  function showWithDelay() {
    if (disabled || !content) return;

    clearTimer();

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setVisible(true);
    }, delay);
  }

  /* ----- Exibir imediatamente por teclado ----- */
  function showImmediately() {
    if (disabled || !content) return;

    clearTimer();
    pointerRef.current = null;
    setVisible(true);
  }

  /* === Referência externa === */
  /* ----- Preservar acesso ao elemento de origem ----- */
  useImperativeHandle(
    children?.props?.ref,
    () => triggerRef.current,
  );

  /* === Ciclo de vida === */
  /* ----- Limpeza ao desmontar ----- */
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  /* ----- Alterações de disponibilidade ----- */
  useEffect(() => {
    if (disabled || !content) {
      clearTimer();
    }
  }, [disabled, content, clearTimer]);

  /* === Posicionamento dinâmico === */
  /* ----- Atualização enquanto estiver visível ----- */
  useLayoutEffect(() => {
    if (!visible || disabled || !content) return undefined;

    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;

    if (!trigger || !tooltip) return undefined;

    function updatePosition() {
      const next = calculatePosition(
        trigger,
        tooltip,
        pointerRef.current,
      );

      setPosition((current) => {
        if (
          current.left === next.left &&
          current.top === next.top
        ) {
          return current;
        }

        return next;
      });
    }

    updatePosition();

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updatePosition)
      : null;

    observer?.observe(trigger);
    observer?.observe(tooltip);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', hide, true);

    return () => {
      observer?.disconnect();

      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', hide, true);
    };
  }, [visible, disabled, content, hide]);

  /* === Validação do elemento de origem === */
  if (!isValidElement(children) || !content) {
    return children;
  }

  /* === Eventos de interação === */
  /* ----- Entrada do ponteiro ----- */
  function handlePointerEnter(event) {
    children.props.onPointerEnter?.(event);

    if (event.pointerType !== 'mouse') return;

    pointerRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    showWithDelay();
  }

  /* ----- Movimentação do ponteiro ----- */
  function handlePointerMove(event) {
    children.props.onPointerMove?.(event);

    if (event.pointerType !== 'mouse') return;

    pointerRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    if (!visible || disabled) return;

    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;

    if (!trigger || !tooltip) return;

    setPosition(
      calculatePosition(trigger, tooltip, pointerRef.current),
    );
  }

  /* ----- Saída do ponteiro ----- */
  function handlePointerLeave(event) {
    children.props.onPointerLeave?.(event);

    pointerRef.current = null;
    hide();
  }

  /* ----- Pressionamento ----- */
  function handlePointerDown(event) {
    children.props.onPointerDown?.(event);
    hide();
  }

  /* ----- Foco por teclado ----- */
  function handleFocus(event) {
    children.props.onFocus?.(event);

    if (event.currentTarget.matches(':focus-visible')) {
      showImmediately();
    }
  }

  /* ----- Perda de foco ----- */
  function handleBlur(event) {
    children.props.onBlur?.(event);
    hide();
  }

  /* ----- Tecla Escape ----- */
  function handleKeyDown(event) {
    children.props.onKeyDown?.(event);

    if (event.key === 'Escape') {
      hide();
    }
  }

  /* === Propriedades do elemento de origem === */
  /* ----- Preservar propriedades e eventos existentes ----- */
  const describedBy = [
    children.props['aria-describedby'],
    visible && !disabled && content ? id : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  /* ----- Preservar propriedades e eventos existentes ----- */
  const triggerProps = {
    ...children.props,
    ref: triggerRef,
    'aria-describedby': describedBy,
    onPointerEnter: handlePointerEnter,
    onPointerMove: handlePointerMove,
    onPointerLeave: handlePointerLeave,
    onPointerDown: handlePointerDown,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
  };

  const trigger = (
    <children.type
      key={children.key}
      {...triggerProps}
    />
  );

  /* === Renderização === */
  return (
    <>
      {/* ----- Elemento de origem ----- */}
      {trigger}

      {/* ----- Tooltip renderizado em portal ----- */}
      {visible &&
        !disabled &&
        content &&
        createPortal(
          <span
            ref={tooltipRef}
            id={id}
            role="tooltip"
            className="ws-tooltip"
            style={{
              left: position.left,
              top: position.top,
            }}
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
}
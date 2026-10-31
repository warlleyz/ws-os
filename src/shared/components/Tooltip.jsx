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

/* === CONFIGURAÇÃO DO TOOLTIP === */
const DEFAULT_DELAY = 450;
const GAP = 6;
const MARGIN = 8;
const POINTER_OFFSET_X = 12;
const POINTER_OFFSET_Y = 16;

/* === POSICIONAMENTO === */
/* ----- LIMITAÇÃO DE COORDENADAS ----- */
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

/* ----- CÁLCULO DA POSIÇÃO ----- */
function calculatePosition(trigger, tooltip, pointer) {
  const anchor = trigger.getBoundingClientRect();
  const width = tooltip.offsetWidth;
  const height = tooltip.offsetHeight;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left;
  let top;

  if (pointer) {
    left = pointer.x + POINTER_OFFSET_X;
    top = pointer.y + POINTER_OFFSET_Y;

    if (left + width + MARGIN > viewportWidth) {
      left = pointer.x - width - POINTER_OFFSET_X;
    }

    if (top + height + MARGIN > viewportHeight) {
      top = pointer.y - height - POINTER_OFFSET_Y;
    }
  } else {
    left = anchor.left + anchor.width / 2 - width / 2;
    top = anchor.bottom + GAP;
  }

  return {
    left: clamp(left, MARGIN, Math.max(MARGIN, viewportWidth - width - MARGIN)),
    top: clamp(top, MARGIN, Math.max(MARGIN, viewportHeight - height - MARGIN)),
  };
}

/* === COMPONENTE TOOLTIP === */
export default function Tooltip({
  content,
  children,
  delay = DEFAULT_DELAY,
  disabled = false,
}) {
  /* ----- REFERÊNCIAS ----- */
  const id = useId();
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const pointerRef = useRef(null);
  const timerRef = useRef(null);

  /* ----- ESTADO DE EXIBIÇÃO ----- */
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
  });

  /* === CONTROLE DE TEMPORIZAÇÃO === */
  /* ----- CANCELAMENTO DO TEMPORIZADOR ----- */
  const clearTimer = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  /* ----- OCULTAÇÃO ----- */
  const hide = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  /* ----- EXIBIÇÃO COM ATRASO ----- */
  function showWithDelay() {
    if (disabled || !content) return;

    clearTimer();

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setVisible(true);
    }, delay);
  }

  /* ----- EXIBIÇÃO IMEDIATA ----- */
  function showImmediately() {
    if (disabled || !content) return;

    clearTimer();
    pointerRef.current = null;
    setVisible(true);
  }

  /* === REFERÊNCIA EXTERNA === */
  useImperativeHandle(children?.props?.ref, () => triggerRef.current);

  /* === CICLO DE VIDA === */
  /* ----- LIMPEZA AO DESMONTAR ----- */
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  /* ----- ALTERAÇÃO DE DISPONIBILIDADE ----- */
  useEffect(() => {
    if (disabled || !content) {
      clearTimer();
    }
  }, [disabled, content, clearTimer]);

  /* === POSICIONAMENTO DINÂMICO === */
  useLayoutEffect(() => {
    if (!visible || disabled || !content) return undefined;

    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;

    if (!trigger || !tooltip) return undefined;

    function updatePosition() {
      const next = calculatePosition(trigger, tooltip, pointerRef.current);

      setPosition((current) => {
        if (current.left === next.left && current.top === next.top) {
          return current;
        }

        return next;
      });
    }

    updatePosition();

    const observer =
      typeof ResizeObserver !== 'undefined'
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

  /* === VALIDAÇÃO DO ELEMENTO === */
  if (!isValidElement(children) || !content) {
    return children;
  }

  /* === EVENTOS DE INTERAÇÃO === */
  /* ----- ENTRADA DO PONTEIRO ----- */
  function handlePointerEnter(event) {
    children.props.onPointerEnter?.(event);

    if (event.pointerType !== 'mouse') return;

    pointerRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    showWithDelay();
  }

  /* ----- MOVIMENTAÇÃO DO PONTEIRO ----- */
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

    setPosition(calculatePosition(trigger, tooltip, pointerRef.current));
  }

  /* ----- SAÍDA DO PONTEIRO ----- */
  function handlePointerLeave(event) {
    children.props.onPointerLeave?.(event);

    pointerRef.current = null;
    clearTimer();
    timerRef.current = window.setTimeout(hide, 150);
  }

  /* ----- PRESSIONAMENTO ----- */
  function handlePointerDown(event) {
    children.props.onPointerDown?.(event);
    hide();
  }

  /* ----- FOCO POR TECLADO ----- */
  function handleFocus(event) {
    children.props.onFocus?.(event);

    if (event.currentTarget.matches(':focus-visible')) {
      showImmediately();
    }
  }

  /* ----- PERDA DE FOCO ----- */
  function handleBlur(event) {
    children.props.onBlur?.(event);
    hide();
  }

  /* ----- TECLA ESCAPE ----- */
  function handleKeyDown(event) {
    if (event.key === 'Escape' && visible) {
      event.preventDefault();
      event.stopPropagation();
      hide();
      return;
    }

    children.props.onKeyDown?.(event);
  }

  /* === PROPRIEDADES DO ELEMENTO === */
  /* ----- DESCRIÇÃO ACESSÍVEL ----- */
  const describedBy =
    [
      children.props['aria-describedby'],
      visible && !disabled && content ? id : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  /* ----- PRESERVAÇÃO DOS EVENTOS ----- */
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

  const trigger = <children.type key={children.key} {...triggerProps} />;

  /* === RENDERIZAÇÃO === */
  return (
    <>
      {trigger}

      {visible &&
        !disabled &&
        content &&
        createPortal(
          <span
            ref={tooltipRef}
            id={id}
            role="tooltip"
            onPointerEnter={clearTimer}
            onPointerLeave={hide}
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
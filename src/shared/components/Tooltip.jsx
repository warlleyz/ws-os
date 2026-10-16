import {
  useEffect,
  useCallback,
  useImperativeHandle,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import './Tooltip.css';

const DEFAULT_DELAY = 450;
const GAP = 6;
const MARGIN = 8;

export default function Tooltip({ content, children, delay = DEFAULT_DELAY, disabled = false }) {
  const id = useId();
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const pointerRef = useRef(null);
  const timerRef = useRef(null);

  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
  });

  function clearTimer() {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  const hide = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setVisible(false);
  }, []);
  useImperativeHandle(children?.props?.ref, () => triggerRef.current);

  function showWithDelay() {
    if (disabled || !content) return;

    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setVisible(true);
    }, delay);
  }

  function showImmediately() {
    if (disabled || !content) return;

    clearTimer();
    setVisible(true);
    pointerRef.current = null;
  }

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (disabled || !content) {
      clearTimer();
    }
  }, [disabled, content]);

  useLayoutEffect(() => {
    if (!visible) return;

    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;

    if (!trigger || !tooltip) return;

    function updatePosition() {
      const anchor = trigger.getBoundingClientRect();

      const width = tooltip.offsetWidth;
      const height = tooltip.offsetHeight;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const pointer = pointerRef.current;

      let left;
      let top;

      if (pointer) {
        // Tooltip próximo ao cursor.
        left = pointer.x + 12;
        top = pointer.y + 16;

        // Inverter horizontalmente quando necessário.
        if (left + width + MARGIN > viewportWidth) {
          left = pointer.x - width - 12;
        }

        // Inverter verticalmente quando necessário.
        if (top + height + MARGIN > viewportHeight) {
          top = pointer.y - height - 12;
        }
      } else {
        // Acesso por teclado: usar o elemento como referência.
        left = anchor.left + anchor.width / 2 - width / 2;
        top = anchor.bottom + GAP;
      }

      // Garantir que permaneça dentro da tela.
      left = Math.max(MARGIN, Math.min(left, viewportWidth - width - MARGIN));

      top = Math.max(MARGIN, Math.min(top, viewportHeight - height - MARGIN));

      setPosition((current) =>
        current.left === left && current.top === top ? current : { left, top },
      );
    }

    updatePosition();

    const observer = new ResizeObserver(updatePosition);
    observer.observe(trigger);
    observer.observe(tooltip);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', hide, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', hide, true);
    };
  }, [visible, hide]);

  if (!children || !content) {
    return children;
  }

  const triggerProps = {
    ...children.props,
    key: children.key,
    ref: triggerRef,

    'aria-describedby': [children.props['aria-describedby'], visible ? id : null]
      .filter(Boolean)
      .join(' '),

    onPointerEnter: (event) => {
      children.props.onPointerEnter?.(event);

      if (event.pointerType === 'mouse') {
        pointerRef.current = {
          x: event.clientX,
          y: event.clientY,
        };

        showWithDelay();
      }
    },

    onPointerMove: (event) => {
      children.props.onPointerMove?.(event);

      if (event.pointerType !== 'mouse') return;

      pointerRef.current = {
        x: event.clientX,
        y: event.clientY,
      };

      if (visible) {
        const tooltip = tooltipRef.current;

        if (!tooltip) return;

        const width = tooltip.offsetWidth;
        const height = tooltip.offsetHeight;

        let left = event.clientX + 12;
        let top = event.clientY + 16;

        if (left + width + MARGIN > window.innerWidth) {
          left = event.clientX - width - 12;
        }

        if (top + height + MARGIN > window.innerHeight) {
          top = event.clientY - height - 12;
        }

        setPosition({
          left: Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN)),
          top: Math.max(MARGIN, Math.min(top, window.innerHeight - height - MARGIN)),
        });
      }
    },

    onPointerLeave: (event) => {
      children.props.onPointerLeave?.(event);
      pointerRef.current = null;
      hide();
    },

    onPointerDown: (event) => {
      children.props.onPointerDown?.(event);
      hide();
    },

    onFocus: (event) => {
      children.props.onFocus?.(event);

      if (event.currentTarget.matches(':focus-visible')) {
        showImmediately();
      }
    },

    onBlur: (event) => {
      children.props.onBlur?.(event);
      hide();
    },

    onKeyDown: (event) => {
      children.props.onKeyDown?.(event);

      if (event.key === 'Escape') {
        hide();
      }
    },
  };
  const trigger = <children.type {...triggerProps} />;

  return (
    <>
      {trigger}

      {visible &&
        !disabled &&
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

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import './Select.css';

/* === Seletor personalizado do sistema === */
/* ----- Lista acessível controlada por botão ----- */
export default function Select({ label, value, options, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const listId = useId();
  const selectedIndex = Math.max(0, options.findIndex((item) => item.value === value));
  const selected = options[selectedIndex];

  /* ----- Fechar ao clicar fora ou mover o foco para outra área ----- */
  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    function handleFocusIn(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [open]);

  /* ----- Manter a opção ativa visível na lista ----- */
  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  function openList(index = selectedIndex) {
    setActiveIndex(index);
    setOpen(true);
  }

  function choose(index) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openList(event.key === 'ArrowDown'
          ? Math.min(selectedIndex + 1, options.length - 1)
          : Math.max(selectedIndex - 1, 0));
      } else {
        setActiveIndex((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
      }
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      if (!open) return;
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1);
      return;
    }

    if (open && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      choose(activeIndex);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`ws-select ${open ? 'ws-select--open' : ''} ${className}`.trim()}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        className="ws-select__trigger"
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${listId}-option-${activeIndex}` : undefined}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => open ? setOpen(false) : openList()}
      >
        <span className="ws-select__value">{selected?.label ?? value}</span>
        <ChevronDown size={15} strokeWidth={1.8} aria-hidden="true" />
      </button>

      {open && (
        <div
          id={listId}
          className="ws-select__options"
          role="listbox"
          aria-label={label}
          tabIndex={-1}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`${listId}-option-${index}`}
              ref={(node) => { optionRefs.current[index] = node; }}
              className={`ws-select__option ${index === activeIndex ? 'ws-select__option--active' : ''}`}
              role="option"
              aria-selected={option.value === value}
              onPointerEnter={() => setActiveIndex(index)}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={14} aria-hidden="true" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

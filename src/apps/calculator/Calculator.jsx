import { useEffect, useRef, useState } from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { calculate } from './calculatorEngine';
import '../../styles/apps.css';
import './Calculator.css';
/* === Histórico local limitado === */
const KEY = 'ws-os:calculator-history';
function loadHistory() {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && stored.length > 20000) return [];
    const items = JSON.parse(stored ?? '[]');
    return Array.isArray(items)
      ? items
          .filter(
            (item) =>
              typeof item?.expression === 'string' &&
              item.expression.trim().length > 0 &&
              item.expression.length <= 256 &&
              Number.isFinite(item.result),
          )
          .slice(0, 20)
      : [];
  } catch {
    return [];
  }
}
/* === Expressão, resultado e interação por instância === */
export default function Calculator() {
  const locale = useLocale();
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(loadHistory);
  const [scientific, setScientific] = useState(false);
  const [angle, setAngle] = useState('deg');
  const inputRef = useRef(null);
  const caretRef = useRef(null);
  useEffect(() => {
    if (caretRef.current !== null) {
      inputRef.current?.setSelectionRange(caretRef.current, caretRef.current);
      caretRef.current = null;
    }
  }, [expression]);
  function replaceExpression(value) {
    setExpression(value.slice(0, 256));
    setResult(null);
    setError('');
  }
  function evaluate() {
    try {
      const value = calculate(expression, angle);
      setResult(value);
      setError('');
      const next = [{ expression, result: value }, ...history].slice(0, 20);
      setHistory(next);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        setError('Histórico disponível somente nesta sessão.');
      }
    } catch (error) {
      setResult(null);
      setError(error.message);
    }
  }
  /* ----- Teclas respeitam seleção e posição de edição ----- */
  function insert(value) {
    if (value === '=') {
      evaluate();
      return;
    }
    if (value === 'AC') {
      replaceExpression('');
      caretRef.current = expression ? 0 : null;
      return;
    }
    const start = inputRef.current?.selectionStart ?? expression.length;
    const end = inputRef.current?.selectionEnd ?? start;
    const from = value === '⌫' && start === end ? Math.max(0, start - 1) : start;
    const addition = value === '⌫' ? '' : value;
    const next = expression.slice(0, from) + addition + expression.slice(end);
    if (next.length > 256) return;
    if (next === expression) {
      inputRef.current?.setSelectionRange(from + addition.length, from + addition.length);
      return;
    }
    caretRef.current = from + addition.length;
    replaceExpression(next);
  }
  return (
    <article className="desktop-window__content ws-app ws-calculator">
      <h2>{t('Calculadora')}</h2>
      <label>
        {t('Expressão')}
        <input
          ref={inputRef}
          value={expression}
          maxLength={256}
          inputMode="text"
          onChange={(event) => {
            caretRef.current = null;
            replaceExpression(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent?.isComposing || event.isComposing) return;
            if (event.key === 'Enter' || event.key === '=') {
              event.preventDefault();
              evaluate();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              insert('AC');
            }
          }}
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <output aria-live="polite" className="ws-calculator__result">
        {result === null ? '—' : result.toLocaleString(locale, { maximumSignificantDigits: 14 })}
      </output>
      {error && <p role="alert">{t(error)}</p>}
      <label>
        <span>{t('Modo científico')}</span>
        <input
          type="checkbox"
          checked={scientific}
          onChange={(event) => setScientific(event.target.checked)}
        />
      </label>
      {scientific && (
        <>
          <label>
            {t('Ângulos')}
            <select
              value={angle}
              onChange={(event) => {
                setAngle(event.target.value);
                setResult(null);
                setError('');
              }}
            >
              <option value="deg">{t('Graus')}</option>
              <option value="rad">{t('Radianos')}</option>
            </select>
          </label>
          <div className="ws-calculator__keys">
            {['sqrt(', 'sin(', 'cos(', 'tan(', 'ln(', 'log(', 'abs(', 'pi', 'e', '^', '(', ')'].map(
              (value) => (
                <button key={value} type="button" onClick={() => insert(value)}>
                  {value}
                </button>
              ),
            )}
          </div>
        </>
      )}
      <div className="ws-calculator__keys">
        {[
          'AC',
          '⌫',
          '%',
          '/',
          '7',
          '8',
          '9',
          '*',
          '4',
          '5',
          '6',
          '-',
          '1',
          '2',
          '3',
          '+',
          '0',
          '.',
          '(',
          ')',
          '=',
        ].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={t(
              value === '⌫'
                ? 'Apagar último caractere'
                : value === 'AC'
                  ? 'Limpar expressão'
                  : value === '='
                    ? 'Calcular'
                    : value,
            )}
            onClick={() => insert(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <p className="ws-app__muted">
        {t('Use Enter para calcular e Escape para limpar. % divide o valor por 100.')}
      </p>
      {history.length > 0 && (
        <section>
          <h3>{t('Histórico local')}</h3>
          <button
            type="button"
            onClick={() => {
              setHistory([]);
              try {
                localStorage.setItem(KEY, '[]');
              } catch {
                setError('Histórico disponível somente nesta sessão.');
              }
            }}
          >
            {t('Limpar histórico')}
          </button>
          <ol>
            {history.map((item, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => {
                    caretRef.current = item.expression.length;
                    replaceExpression(item.expression);
                  }}
                >
                  {item.expression} ={' '}
                  {item.result.toLocaleString(locale, { maximumSignificantDigits: 14 })}
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

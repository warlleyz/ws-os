import { useEffect, useRef, useState } from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { calculate } from './calculatorEngine';
import '../../styles/apps.css';
import './Calculator.css';

/* === HISTÓRICO LOCAL === */
/* ----- Carregamento e validação dos cálculos armazenados ----- */
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

/* === CONFIGURAÇÃO DAS TECLAS === */
const BASIC_KEYS = [
  'AC', '⌫', '%', '/',
  '7', '8', '9', '*',
  '4', '5', '6', '-',
  '1', '2', '3', '+',
  '0', '.', '(', ')',
  '=',
];

const SCIENTIFIC_KEYS = [
  'sqrt(', 'sin(', 'cos(', 'tan(',
  'ln(', 'log(', 'abs(', 'pi',
  'e', '^', '(', ')',
];

function keyClass(value) {
  if (value === '=') return 'ws-calculator__key ws-calculator__key--equals';
  if (value === 'AC' || value === '⌫') return 'ws-calculator__key ws-calculator__key--utility';
  if (['/', '*', '-', '+', '%', '^'].includes(value)) {
    return 'ws-calculator__key ws-calculator__key--operator';
  }
  return 'ws-calculator__key';
}

/* === APLICATIVO CALCULADORA === */
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

  /* ----- Restaurar posição do cursor após editar pelas teclas ----- */
  useEffect(() => {
    if (caretRef.current !== null) {
      inputRef.current?.setSelectionRange(caretRef.current, caretRef.current);
      caretRef.current = null;
    }
  }, [expression]);

  /* ----- Atualizar expressão sem manter resultados obsoletos ----- */
  function replaceExpression(value) {
    setExpression(value.slice(0, 256));
    setResult(null);
    setError('');
  }

  /* ----- Calcular e armazenar no histórico local ----- */
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
    } catch (calculationError) {
      setResult(null);
      setError(calculationError.message);
    }
  }

  /* ----- Inserção que respeita seleção e posição do cursor ----- */
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

  /* ----- Reutilizar uma expressão do histórico ----- */
  function restoreHistoryExpression(value) {
    caretRef.current = value.length;
    replaceExpression(value);
  }

  /* ----- Limpar histórico salvo ----- */
  function clearHistory() {
    setHistory([]);
    try {
      localStorage.setItem(KEY, '[]');
    } catch {
      setError('Histórico disponível somente nesta sessão.');
    }
  }

  const formattedResult = result === null
    ? '—'
    : result.toLocaleString(locale, { maximumSignificantDigits: 14 });

  /* === INTERFACE === */
  return (
    <article className="desktop-window__content ws-app ws-calculator">
      {/* ----- Cabeçalho e modo de operação ----- */}
      <header className="ws-calculator__header">
        <div className="ws-calculator__heading">
          <h2>{t('Calculadora')}</h2>
          <span className="ws-calculator__mode-label">
            {t(scientific ? 'Modo científico' : 'Calculadora')}
          </span>
        </div>
        <label className="ws-calculator__mode-toggle">
          <span>{t('Modo científico')}</span>
          <input
            type="checkbox"
            checked={scientific}
            onChange={(event) => setScientific(event.target.checked)}
          />
        </label>
      </header>

      {/* ----- Visor de entrada e resultado ----- */}
      <section className="ws-calculator__display" aria-label={t('Expressão')}>
        <label className="ws-calculator__expression-label" htmlFor="ws-calculator-expression">
          {t('Expressão')}
        </label>
        <input
          id="ws-calculator-expression"
          ref={inputRef}
          className="ws-calculator__expression"
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
        <output aria-live="polite" className="ws-calculator__result">
          {formattedResult}
        </output>
      </section>

      {error && (
        <p className="ws-calculator__error" role="alert">
          {t(error)}
        </p>
      )}

      {/* ----- Ferramentas científicas ----- */}
      {scientific && (
        <section className="ws-calculator__scientific" aria-label={t('Modo científico')}>
          <label className="ws-calculator__angle">
            <span>{t('Ângulos')}</span>
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
          <div className="ws-calculator__keys ws-calculator__keys--scientific">
            {SCIENTIFIC_KEYS.map((value) => (
              <button
                key={value}
                type="button"
                className="ws-calculator__key ws-calculator__key--scientific"
                onClick={() => insert(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ----- Teclado principal ----- */}
      <div className="ws-calculator__keys ws-calculator__keys--basic">
        {BASIC_KEYS.map((value) => (
          <button
            key={value}
            type="button"
            className={keyClass(value)}
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

      {/* ----- Instrução de teclado ----- */}
      <p className="ws-calculator__hint ws-app__muted">
        {t('Use Enter para calcular e Escape para limpar. % divide o valor por 100.')}
      </p>

      {/* ----- Histórico de operações ----- */}
      {history.length > 0 && (
        <section className="ws-calculator__history">
          <div className="ws-calculator__history-header">
            <h3>{t('Histórico local')}</h3>
            <button type="button" onClick={clearHistory}>
              {t('Limpar histórico')}
            </button>
          </div>
          <ol className="ws-calculator__history-list">
            {history.map((item, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => restoreHistoryExpression(item.expression)}
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

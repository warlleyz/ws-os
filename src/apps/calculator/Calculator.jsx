
import { useEffect, useRef, useState } from 'react';
import { Calculator as CalculatorIcon, History, FlaskConical, Delete } from 'lucide-react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { calculate } from './calculatorEngine';
import Select from '../../shared/components/Select';
import '../../styles/apps.css';
import './Calculator.css';

/* === HISTÓRICO LOCAL === */
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

const OPERATOR_LABELS = {
  '/': '÷',
  '*': '×',
  '-': '−',
  '+': '+',
  '^': 'xʸ',
  'sqrt(': '√x',
  'pi': 'π',
  '⌫': '⌫',
};

function keyClass(value) {
  const classes = ['ws-calculator__key'];

  if (value === '=') classes.push('ws-calculator__key--equals');
  else if (value === 'AC' || value === '⌫') {
    classes.push('ws-calculator__key--utility');
  } else if (['/', '*', '-', '+', '%', '^'].includes(value)) {
    classes.push('ws-calculator__key--operator');
  } else {
    classes.push('ws-calculator__key--number');
  }

  return classes.join(' ');
}

function formatResult(value, locale) {
  return value === null
    ? '—'
    : value.toLocaleString(locale, { maximumSignificantDigits: 14 });
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

  /* ----- Restauração do cursor ----- */
  useEffect(() => {
    if (caretRef.current !== null) {
      inputRef.current?.setSelectionRange(
        caretRef.current,
        caretRef.current,
      );
      caretRef.current = null;
    }
  }, [expression]);

  /* ----- Entrada e resultado ----- */
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
    } catch (calculationError) {
      setResult(null);
      setError(
        typeof calculationError?.message === 'string'
          ? calculationError.message
          : 'Expressão inválida.',
      );
    }
  }

  /* ----- Inserção com seleção e cursor ----- */
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
    const from =
      value === '⌫' && start === end
        ? Math.max(0, start - 1)
        : start;
    const addition = value === '⌫' ? '' : value;
    const next =
      expression.slice(0, from) +
      addition +
      expression.slice(end);

    if (next.length > 256) return;

    if (next === expression) {
      inputRef.current?.setSelectionRange(
        from + addition.length,
        from + addition.length,
      );
      return;
    }

    caretRef.current = from + addition.length;
    replaceExpression(next);
  }

  /* ----- Histórico ----- */
  function restoreHistoryExpression(value) {
    caretRef.current = value.length;
    replaceExpression(value);
  }

  function clearHistory() {
    setHistory([]);
    try {
      localStorage.setItem(KEY, '[]');
    } catch {
      setError('Histórico disponível somente nesta sessão.');
    }
  }

  const formattedResult = formatResult(result, locale);

  /* === INTERFACE === */
  return (
    <article className="desktop-window__content ws-app ws-calculator">
      <header className="ws-calculator__header">
        <div className="ws-calculator__brand">
          <div className="ws-calculator__brand-icon" aria-hidden="true">
            <CalculatorIcon size={20} strokeWidth={2} />
          </div>

          <div className="ws-calculator__heading">
            <h2>{t('Calculadora')}</h2>
            <span className="ws-calculator__subtitle">
              WS OS / {t(scientific ? 'Modo científico' : 'Calculadora')}
            </span>
          </div>
        </div>

        <label className="ws-calculator__mode-toggle">
          <input
            type="checkbox"
            checked={scientific}
            onChange={(event) => setScientific(event.target.checked)}
          />
          <span className="ws-calculator__mode-control">
            <FlaskConical size={15} aria-hidden="true" />
            {t('Modo científico')}
          </span>
        </label>
      </header>

      <div className="ws-calculator__workspace">
        <main className="ws-calculator__main">
          {/* === VISOR === */}
          <section
            className="ws-calculator__display"
            aria-label={t('Expressão')}
          >
            <div className="ws-calculator__display-top">
              <span className="ws-calculator__display-caption">
                {t('Expressão')}
              </span>
              <span className="ws-calculator__display-status">
                {scientific ? angle.toUpperCase() : 'STD'}
              </span>
            </div>

            <label
              className="ws-calculator__expression-label"
              htmlFor="ws-calculator-expression"
            >
              {t('Expressão')}
            </label>

            <input
              id="ws-calculator-expression"
              ref={inputRef}
              className="ws-calculator__expression"
              value={expression}
              maxLength={256}
              inputMode="text"
              placeholder="0"
              onChange={(event) => {
                caretRef.current = null;
                replaceExpression(event.target.value);
              }}
              onKeyDown={(event) => {
                if (
                  event.nativeEvent?.isComposing ||
                  event.isComposing
                ) return;

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

            <div className="ws-calculator__result-area">
              <span className="ws-calculator__result-caption">
                {t('Resultado')}
              </span>

              <output
                aria-live="polite"
                className="ws-calculator__result"
                title={formattedResult}
              >
                {formattedResult}
              </output>
            </div>
          </section>

          {error && (
            <p className="ws-calculator__error" role="alert">
              {t(error)}
            </p>
          )}

          {/* === TECLADO === */}
          <section className="ws-calculator__keyboard">
            {scientific && (
              <div className="ws-calculator__scientific">
                <div className="ws-calculator__scientific-header">
                  <span className="ws-calculator__section-label">
                    {t('Modo científico')}
                  </span>

                  <label className="ws-calculator__angle">
                    <span>{t('Ângulos')}</span>
                    <Select
                      label={t('Ângulos')}
                      value={angle}
                      variant="compact"
                      options={[
                        { value: 'deg', label: t('Graus') },
                        { value: 'rad', label: t('Radianos') },
                      ]}
                      onChange={(value) => {
                        setAngle(value);
                        setResult(null);
                        setError('');
                      }}
                    />
                  </label>
                </div>

                <div className="ws-calculator__keys ws-calculator__keys--scientific">
                  {SCIENTIFIC_KEYS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="ws-calculator__key ws-calculator__key--scientific"
                      aria-label={value}
                      onClick={() => insert(value)}
                    >
                      {OPERATOR_LABELS[value] ?? value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="ws-calculator__keyboard-heading">
              <span className="ws-calculator__section-label">
                {t('Calculadora')}
              </span>
              <span className="ws-calculator__keyboard-meta">
                {scientific ? 'SCI' : 'STD'}
              </span>
            </div>

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
                  {value === '⌫' ? (
                    <>
                      <Delete size={20} strokeWidth={1.8} aria-hidden="true" />
                      <span className="ws-calculator__sr-only">⌫</span>
                    </>
                  ) : (
                    value
                  )}
                </button>
              ))}
            </div>
          </section>

          <p className="ws-calculator__hint ws-app__muted">
            {t('Use Enter para calcular e Escape para limpar. % divide o valor por 100.')}
          </p>
        </main>

        {/* === HISTÓRICO === */}
        <aside className="ws-calculator__history-panel">
          <div className="ws-calculator__history-header">
            <div className="ws-calculator__history-title">
              <History size={17} aria-hidden="true" />
              <h3>{t('Histórico local')}</h3>
              <span className="ws-calculator__history-count">
                {history.length}
              </span>
            </div>

            {history.length > 0 && (
              <button
                type="button"
                className="ws-calculator__clear-history"
                onClick={clearHistory}
              >
                {t('Limpar histórico')}
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <ol className="ws-calculator__history-list">
              {history.map((item, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() =>
                      restoreHistoryExpression(item.expression)
                    }
                  >
                    {item.expression} ={' '}
                    {formatResult(item.result, locale)}
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <div className="ws-calculator__history-empty">
              <History size={24} strokeWidth={1.5} aria-hidden="true" />
              <p>{t('Histórico local')}</p>
                <span>{t('As operações realizadas aparecerão aqui.')}</span>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}

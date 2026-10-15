import { useState } from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { calculate } from './calculatorEngine';
import '../../styles/apps.css';
import './Calculator.css';
const KEY = 'ws-os:calculator-history';
function loadHistory() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(items)
      ? items
          .filter(
            (item) =>
              typeof item?.expression === 'string' &&
              item.expression.length <= 256 &&
              Number.isFinite(item.result),
          )
          .slice(0, 20)
      : [];
  } catch {
    return [];
  }
}
export default function Calculator() {
  const locale = useLocale();
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(loadHistory);
  const [scientific, setScientific] = useState(false);
  const [angle, setAngle] = useState('deg');
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
  function insert(value) {
    if (value === 'AC') {
      setExpression('');
      setResult(null);
      setError('');
    } else if (value === '⌫') setExpression((current) => current.slice(0, -1));
    else if (value === '=') evaluate();
    else setExpression((current) => (current + value).slice(0, 256));
  }
  return (
    <article className="desktop-window__content ws-app ws-calculator">
      <h2>{t('Calculadora')}</h2>
      <label>
        {t('Expressão')}
        <input
          value={expression}
          maxLength={256}
          inputMode="text"
          onChange={(event) => setExpression(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              evaluate();
            }
            if (event.key === 'Escape') insert('AC');
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
            <select value={angle} onChange={(event) => setAngle(event.target.value)}>
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
                <button type="button" onClick={() => setExpression(item.expression)}>
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

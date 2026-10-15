export function calculate(raw, angle = 'deg') {
  if (typeof raw !== 'string' || raw.length > 256 || !raw.trim())
    throw new Error('Expressão inválida.');
  const text = raw
    .replaceAll(',', '.')
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('π', 'pi');
  const tokens = [];
  let cursor = 0;
  while (cursor < text.length) {
    if (/\s/.test(text[cursor])) {
      cursor++;
      continue;
    }
    const number = text.slice(cursor).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
    if (number) {
      tokens.push(Number(number[0]));
      cursor += number[0].length;
    } else {
      const name = text.slice(cursor).match(/^[a-z]+/i);
      if (name) {
        tokens.push(name[0].toLowerCase());
        cursor += name[0].length;
      } else if ('+-*/^()%'.includes(text[cursor])) tokens.push(text[cursor++]);
      else throw new Error('Expressão inválida.');
    }
    if (tokens.length > 128) throw new Error('Expressão muito longa.');
  }
  let index = 0,
    depth = 0;
  const finite = (value) => {
    if (!Number.isFinite(value))
      throw new Error('Resultado fora do domínio ou do limite numérico.');
    return value;
  };
  function primary() {
    if (++depth > 32) throw new Error('Expressão muito longa.');
    let value,
      token = tokens[index++];
    if (typeof token === 'number') value = token;
    else if (token === 'pi') value = Math.PI;
    else if (token === 'e') value = Math.E;
    else if (token === '(') {
      value = expression();
      if (tokens[index++] !== ')') throw new Error('Parênteses inválidos.');
    } else if (['sqrt', 'sin', 'cos', 'tan', 'ln', 'log', 'abs'].includes(token)) {
      if (tokens[index++] !== '(') throw new Error('Use parênteses na função.');
      const argument = expression();
      if (tokens[index++] !== ')') throw new Error('Parênteses inválidos.');
      const radians = angle === 'deg' ? (argument * Math.PI) / 180 : argument;
      if (token === 'tan' && Math.abs(Math.cos(radians)) < 1e-12)
        throw new Error('Resultado fora do domínio ou do limite numérico.');
      value = (
        { sqrt: Math.sqrt, ln: Math.log, log: Math.log10, abs: Math.abs }[token] ?? Math[token]
      )(['sin', 'cos', 'tan'].includes(token) ? radians : argument);
    } else throw new Error('Expressão inválida.');
    while (tokens[index] === '%') {
      value /= 100;
      index++;
    }
    depth--;
    return finite(value);
  }
  function power() {
    let value = primary();
    if (tokens[index] === '^') {
      index++;
      value = finite(value ** unary());
    }
    return value;
  }
  function unary() {
    if (tokens[index] === '+') {
      index++;
      return unary();
    }
    if (tokens[index] === '-') {
      index++;
      return -unary();
    }
    return power();
  }
  function term() {
    let value = unary();
    while (['*', '/'].includes(tokens[index])) {
      const operator = tokens[index++],
        right = unary();
      if (operator === '/' && right === 0) throw new Error('Divisão por zero.');
      value = finite(operator === '*' ? value * right : value / right);
    }
    return value;
  }
  function expression() {
    let value = term();
    while (['+', '-'].includes(tokens[index])) {
      const operator = tokens[index++],
        right = term();
      value = finite(operator === '+' ? value + right : value - right);
    }
    return value;
  }
  const result = finite(expression());
  if (index !== tokens.length) throw new Error('Expressão inválida.');
  return Number(result.toPrecision(14));
}

export function findText(text, query, start = 0) {
  if (!query) return -1;
  const found = text.indexOf(query, Math.max(0, start));
  return found < 0 ? text.indexOf(query) : found;
}
export function replaceText(text, query, replacement, all = false) {
  if (!query) return text;
  if (all) return text.split(query).join(replacement);
  const index = text.indexOf(query);
  return index < 0 ? text : text.slice(0, index) + replacement + text.slice(index + query.length);
}
export function tokenizeText(text) {
  if (text.length > 100000) return [{ text, type: 'plain' }];
  const regex =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(const|let|var|function|return|if|else|class|import|export|from|true|false|null|async|await|new|throw|for|while)\b|(\b\d+(?:\.\d+)?\b)/g;
  const result = [];
  let offset = 0;
  for (const match of text.matchAll(regex)) {
    if (match.index > offset) result.push({ text: text.slice(offset, match.index), type: 'plain' });
    result.push({
      text: match[0],
      type: match[1] ? 'comment' : match[2] ? 'string' : match[3] ? 'keyword' : 'number',
    });
    offset = match.index + match[0].length;
  }
  if (offset < text.length) result.push({ text: text.slice(offset), type: 'plain' });
  return result;
}

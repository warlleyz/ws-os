const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* === Carregamento de contratos com dependências reais === */
function loadContract(file, bindings = {}) {
  const modules = new Map();
  function read(filename) {
    const resolved = path.resolve(filename);
    if (modules.has(resolved)) return modules.get(resolved);
    const source = fs.readFileSync(resolved, 'utf8');
    const names = [
      ...source.matchAll(/\bexport\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/g),
    ].map((match) => match[1]);
    const code = source
      .replace(
        /import\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"];?/g,
        (_match, fields, dependency) => {
          const target = path.resolve(
            path.dirname(resolved),
            dependency + (path.extname(dependency) ? '' : '.js'),
          );
          return `const {${fields.replace(/\s+as\s+/g, ':')}} = __import(${JSON.stringify(target)});`;
        },
      )
      .replace(/\bexport\s+(?=(?:async\s+)?(?:function|const|let|class)\b)/g, '');
    const result = vm.runInNewContext(
      `(()=>{${code};return {${names.join(',')}};})()`,
      {
        URL,
        URLSearchParams,
        AbortController,
        DOMException,
        setTimeout,
        clearTimeout,
        TextEncoder,
        TextDecoder,
        crypto: require('node:crypto').webcrypto,
        ...bindings,
        __import: read,
      },
      { filename: resolved },
    );
    modules.set(resolved, result);
    return result;
  }
  return read(file);
}

module.exports = { loadContract };

const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
function load(file, names) {
  const source = fs.readFileSync(path.join(root, file), 'utf8').replace(/\bexport\s+/g, '');
  return vm.runInNewContext(`(()=>{${source};return{${names.join(',')}}})()`);
}
test('terminal interpreta aspas e não trata operadores de shell como execução', () => {
  const m = load('src/apps/terminal/terminalCommands.js', ['parseCommand', 'completeCommand']);
  assert.equal(m.parseCommand('open "Sobre Mim"').args[0], 'Sobre Mim');
  assert.equal(m.parseCommand('echo <script>alert(1)</script>').name, 'echo');
  assert.equal(m.parseCommand('open projects; rm -rf /').args[0], 'projects;');
  assert.throws(() => m.parseCommand('open "missing'), /Aspas/);
  assert.equal(m.completeCommand('op', []), 'open ');
  assert.equal(m.completeCommand('open proj', ['projects']), 'open projects');
});
test('Wally local só sugere ações públicas conhecidas e não inventa IA', () => {
  const m = load('src/services/wallyService.js', ['localWallyAnswer']);
  assert.equal(m.localWallyAnswer('meus projetos').actions[0].appId, 'projects');
  assert.equal(m.localWallyAnswer('delete all files').actions[0].appId, 'files');
  assert.equal(m.localWallyAnswer('qualquer coisa').actions.length, 0);
  assert.match(m.localWallyAnswer('qualquer coisa').message, /modo local/);
  assert.equal(m.localWallyAnswer('login password').actions.length, 0);
});

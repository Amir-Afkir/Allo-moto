const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

/** Load the real source with isolated framework boundaries. Never copy implementation into tests. */
function createLoader(overrides = {}) {
  const cache = new Map();
  const invalidations = [];
  const mocks = {
    'server-only': {},
    'next/cache': { unstable_cache: (fn) => fn, revalidateTag: (tag) => invalidations.push(tag) },
    postgres: () => { throw new Error('Unexpected database access in an isolated test'); },
    ...overrides,
  };
  function load(filename) {
    if (Object.hasOwn(mocks, filename)) return mocks[filename];
    const absolute = path.isAbsolute(filename) ? filename : path.join(root, filename);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} };
    cache.set(absolute, module);
    const source = fs.readFileSync(absolute, 'utf8');
    const result = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
      fileName: absolute,
      reportDiagnostics: true,
    });
    const errors = result.diagnostics?.filter((d) => d.category === ts.DiagnosticCategory.Error) ?? [];
    if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
      getCurrentDirectory: () => root, getCanonicalFileName: (f) => f, getNewLine: () => '\n',
    }));
    const localRequire = (specifier) => {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      if (specifier.startsWith('@/') || specifier.startsWith('.')) {
        const base = specifier.startsWith('@/') ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(absolute), specifier);
        const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
        if (!resolved) throw new Error(`Cannot resolve ${specifier} from ${absolute}`);
        return load(resolved);
      }
      return require(specifier);
    };
    new vm.Script(`(function(require,module,exports,__dirname,__filename){${result.outputText}\n})`, { filename: absolute })
      .runInThisContext()(localRequire, module, module.exports, path.dirname(absolute), absolute);
    return module.exports;
  }
  return { load, invalidations };
}
module.exports = { createLoader, root };

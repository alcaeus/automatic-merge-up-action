// @actions/* v3+ packages are ESM-only (their "exports" only define "import").
// Resolve them with the "import" condition and let ts-jest transpile them to
// CommonJS so the test suite can keep running without Jest's ESM mode.
module.exports = (request, options) => {
  if (request.startsWith('@actions/')) {
    return options.defaultResolver(request, {
      ...options,
      conditions: ['import', 'node', 'default']
    })
  }

  return options.defaultResolver(request, options)
}

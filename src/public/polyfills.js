/**
 * Runtime logic to inject polyfills into the global namespace based on browser detection.
 */

if (isInternetExplorer()) {
  // Polyfills crucial, commonly used functions expected to be in the standard library
  // e.g. Promises, Object.values, Array.prototype.includes
  // The stable option includes ES and web standards.
  // See link for more info:
  // https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md
  require('core-js/stable')

  // Runtime library for async and generator functions
  require('regenerator-runtime/runtime')

  require('web-streams-polyfill') // Web Streams API
  require('whatwg-fetch') // fetch API
  require('abortcontroller-polyfill/dist/polyfill-patch-fetch') // AbortController

  // TextEncoder and TextDecoder
  const textEncoding = require('text-encoding')

  if (!window['TextDecoder']) {
    window['TextDecoder'] = textEncoding.TextDecoder
  }

  if (!window['TextEncoder']) {
    window['TextEncoder'] = textEncoding.TextEncoder
  }
}

/**
 * Detects if the runtime browser is Internet Explorer. Works for IE5 and upwards, so
 * should be considered pretty safe since even IE 10 is ancient.
 *
 * This function is not safe to call from WebWorkers as those do not have access to the
 * window object.
 * See https://www.w3schools.com/jsref/prop_doc_documentmode.asp
 */
function isInternetExplorer() {
  return Boolean(window.document.documentMode)
}

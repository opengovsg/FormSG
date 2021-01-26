/**
 * Runtime polyfill injection with feature detection to make app work on older browsers.
 */

// core-js polyfills crucial, commonly used functions expected to be in the standard library
// e.g. Promise, Object.values, Array.prototype.includes
// The stable option includes ES and web standards. See link for more info:
// https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md
require('core-js/stable')

// Runtime library for async and generator functions. Babel transpilation expects this to be in
// the target namespace, and it also relies on core-js, so this cannot be removed
// until IE11 support is dropped.
require('regenerator-runtime/runtime')

// Web Streams API has varying levels of support amongst different browsers
// See https://caniuse.com/streams
if (!window.ReadableStream || !window.WritableStream) {
  require('web-streams-polyfill')
}

// For IE11, Opera Mini
// https://caniuse.com/?search=fetch
if (!window.fetch) {
  require('whatwg-fetch') // fetch API
  require('abortcontroller-polyfill/dist/polyfill-patch-fetch')
}

// For IE11, Opera Mini
// https://caniuse.com/?search=TextEncoder
if (!window.TextDecoder || !window.TextEncoder) {
  // TextEncoder and TextDecoder
  const textEncoding = require('text-encoding')
  window['TextDecoder'] = textEncoding.TextDecoder
  window['TextEncoder'] = textEncoding.TextEncoder
}

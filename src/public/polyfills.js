// Polyfills crucial, commonly used functions from the standard library.
// The stable option includes ES and web standards.
// See link for more info:
//  https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md
require('core-js/stable')

// Runtime library for async and generator functions
require('regenerator-runtime/runtime')

require('web-streams-polyfill') // Web Streams
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

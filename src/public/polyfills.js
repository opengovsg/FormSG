require('core-js/stable')
require('regenerator-runtime/runtime')

require('web-streams-polyfill') // Web Streams
require('whatwg-fetch') // fetch
require('abortcontroller-polyfill/dist/polyfill-patch-fetch') // AbortController

// TextEncoder and TextDecoder
const textEncoding = require('text-encoding')

if (!window['TextDecoder']) {
  window['TextDecoder'] = textEncoding.TextDecoder
}

if (!window['TextEncoder']) {
  window['TextEncoder'] = textEncoding.TextEncoder
}

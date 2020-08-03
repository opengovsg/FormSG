/* eslint-disable camelcase */
'use strict'

// Polyfills
const streams = require('web-streams-polyfill')
const textEncoding = require('text-encoding')

// Use polyfill if it does not exist
if (!window['TextDecoder']) {
  window['TextDecoder'] = textEncoding.TextDecoder
}

// Modified fork of https://github.com/canjs/can-ndjson-stream to use polyfilled
// ReadableStream so it works in ie11.

// Also modified to return the string immediately instead of parsing since the
// string is to be passed into a decryption worker.

const ndjsonStream = function (response) {
  // For cancellation
  var is_reader
  var cancellationRequest = false
  return new streams.ReadableStream({
    start: function (controller) {
      var reader = response.getReader()
      is_reader = reader
      var decoder = new TextDecoder()
      var data_buf = ''

      reader.read().then(function processResult(result) {
        if (result.done) {
          if (cancellationRequest) {
            // Immediately exit
            return
          }

          data_buf = data_buf.trim()
          if (data_buf.length !== 0) {
            try {
              controller.enqueue(data_buf)
            } catch (e) {
              controller.error(e)
              return
            }
          }
          controller.close()
          return
        }

        var data = decoder.decode(result.value, { stream: true })
        data_buf += data
        var lines = data_buf.split('\n')
        for (var i = 0; i < lines.length - 1; ++i) {
          var l = lines[i].trim()
          if (l.length > 0) {
            try {
              controller.enqueue(l)
            } catch (e) {
              controller.error(e)
              cancellationRequest = true
              reader.cancel()
              return
            }
          }
        }
        data_buf = lines[lines.length - 1]

        return reader.read().then(processResult)
      })
    },
    cancel: function (reason) {
      console.log('Cancel registered due to ', reason)
      cancellationRequest = true
      is_reader.cancel()
    },
  })
}

module.exports = ndjsonStream

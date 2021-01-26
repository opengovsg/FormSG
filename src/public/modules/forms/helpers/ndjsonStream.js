/* eslint-disable camelcase */
'use strict'

// Modified fork of https://github.com/canjs/can-ndjson-stream to enqueue
// the string immediately without a JSON.parse() step, as the stream payload
// is to be decrypted by the decryption worker.

// Note that this code assumes a polyfill of TextDecoder is available to run in IE11.

const ndjsonStream = function (response) {
  // For cancellation
  var is_reader
  var cancellationRequest = false
  return new ReadableStream({
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

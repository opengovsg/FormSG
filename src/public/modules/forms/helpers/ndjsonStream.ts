// Modified fork of https://github.com/canjs/can-ndjson-stream to enqueue
// the string immediately without a JSON.parse() step, as the stream payload
// is to be decrypted by the decryption worker.

// Note that this code assumes a polyfill of TextDecoder is available to run in IE11.

export const ndjsonStream = (
  response: ReadableStream<Uint8Array>,
): ReadableStream => {
  // For cancellation
  let maybeReader: ReadableStreamDefaultReader<Uint8Array> | undefined
  let shouldCancel = false
  return new ReadableStream({
    start: function (controller) {
      const reader = response.getReader()
      maybeReader = reader
      const decoder = new TextDecoder()
      let data_buf = ''

      return reader
        .read()
        .then(function processResult(result): Promise<void> | undefined | void {
          if (result.done && shouldCancel) {
            return
          }

          if (result.done) {
            data_buf = data_buf.trim()
            if (data_buf.length !== 0) {
              try {
                controller.enqueue(data_buf)
              } catch (e) {
                controller.error(e)
                return
              }
            }
            return controller.close()
          }

          // Read the input in as a stream and split by newline and trim
          data_buf += decoder.decode(result.value, { stream: true })
          const lines = data_buf.split('\n')

          // Reads in every line BUT the last
          // Trims the line and queues it in the controller if there is content in the line
          for (let i = 0; i < lines.length - 1; ++i) {
            const l = lines[i].trim()
            if (l.length > 0) {
              try {
                controller.enqueue(l)
              } catch (e) {
                controller.error(e)
                shouldCancel = true
                return reader.cancel()
              }
            }
          }
          data_buf = lines[lines.length - 1]

          return reader.read().then(processResult)
        })
    },
    cancel: function (reason) {
      console.log('Cancel registered due to ', reason)
      shouldCancel = true
      if (maybeReader) {
        return maybeReader.cancel()
      }
    },
  })
}

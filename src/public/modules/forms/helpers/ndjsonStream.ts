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

      return reader
        .read()
        .then(function processResult(result): Promise<void> | undefined | void {
          if (shouldCancel) {
            return
          }

          if (result.done) {
            return controller.close()
          }

          // Read the input in as a stream and split by newline and trim
          const lines = decoder
            .decode(result.value, { stream: true })
            .split('\n')
            .map((line) => line.trim())

          // Only append if there is content available
          lines.forEach((line) => {
            if (line) {
              try {
                controller.enqueue(line)
              } catch (e) {
                controller.error(e)
                shouldCancel = true
                return reader.cancel()
              }
            }
          })

          return reader.read().then(processResult)
        })
    },
    cancel: function (reason) {
      console.log('Cancel registered due to ', reason)
      shouldCancel = true
      maybeReader && maybeReader.cancel()
    },
  })
}

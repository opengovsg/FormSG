import Papa from 'papaparse'

const csvFileToCsvStringReadableStream = <T>(file: File): ReadableStream<T> => {
  return new ReadableStream({
    start(controller) {
      parseCsvFileToCsvStringWithChunking<T>(file, (chunk) => {
        if (chunk) {
          controller.enqueue(...chunk)
        } else {
          controller.close()
        }
      })
    },
  })
}

const parseCsvFileToCsvStringWithChunking = <T>(
  file: File,
  onChunk: (rows: T[] | null) => void,
) => {
  Papa.parse<T>(file, {
    worker: true,
    chunk: (chunk) => {
      onChunk(chunk.data)
    },
    complete: () => {
      // marks the end of the ReadableStream
      onChunk(null)
    },
  })
}

export default csvFileToCsvStringReadableStream

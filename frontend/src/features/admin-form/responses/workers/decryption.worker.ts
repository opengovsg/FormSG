import { expose } from 'comlink'

function decryptIntoCsv(data: any) {
  console.log(data)
  return data
}

const exports = {
  decryptIntoCsv,
}

export type DecryptionWorker = typeof exports

expose(exports)

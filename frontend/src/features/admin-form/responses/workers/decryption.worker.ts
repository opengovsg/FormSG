import { expose } from 'comlink'

async function log(id: number): Promise<string> {
  console.log(id + ' web worker is running')
  return id.toString()
}

const exports = {
  log,
}

export type DecryptionWorker = typeof exports

expose(exports)

import { releaseProxy, wrap } from 'comlink'

import { CleanableDecryptionWorkerApi } from '../../ResponsesPage/storage/types'
import type { DecryptionWorkerApi } from '../../ResponsesPage/storage/worker/decryption.worker'
import DecryptionWorker from '../../ResponsesPage/storage/worker/decryption.worker?worker'

/**
 * Creates a worker, a cleanup function and returns it
 */
export const makeWorkerApiAndCleanup = (): CleanableDecryptionWorkerApi => {
  // Create a worker and wrap it with comlink for ease of interaction.
  const worker = new DecryptionWorker()
  const workerApi = wrap<DecryptionWorkerApi>(worker)

  // A cleanup function that releases the comlink proxy and terminates the worker
  const cleanup = () => {
    workerApi[releaseProxy]()
    worker.terminate()
  }

  const workerApiAndCleanup = { workerApi, cleanup }

  return workerApiAndCleanup
}

export const killWorkers = (workers: CleanableDecryptionWorkerApi[]): void => {
  return workers.forEach((worker) => worker.cleanup())
}

import { releaseProxy, Remote, wrap } from 'comlink'

import type { ZipWorkerApi } from '../worker/zip.worker'
import ZipWorker from '../worker/zip.worker?worker'

export type CleanableZipWorkerApi = {
  workerApi: Remote<ZipWorkerApi>
  /** Terminates the worker. Safe to call more than once. */
  cleanup: () => void
  /** Discards the zip, then terminates the worker. */
  abort: () => void
}

/** Creates the worker that builds a download's zip. */
export const makeZipWorkerApiAndCleanup = (): CleanableZipWorkerApi => {
  const worker = new ZipWorker()
  const workerApi = wrap<ZipWorkerApi>(worker)
  // A released proxy throws if it is used again
  let isCleanedUp = false

  const cleanup = () => {
    if (isCleanedUp) return
    isCleanedUp = true
    workerApi[releaseProxy]()
    worker.terminate()
  }

  const abort = () => {
    if (isCleanedUp) return
    workerApi
      .abort()
      .catch(() => undefined)
      .finally(cleanup)
  }

  return { workerApi, cleanup, abort }
}

import { releaseProxy, wrap } from 'comlink'

import { waitForMs } from '~utils/waitForMs'

import type { ZipWorkerApi } from '../worker/zip.worker'
import ZipWorker from '../worker/zip.worker?worker'

import { ZipEntry } from './ZipStreamWriter'

const ZIP_ABORT_TIMEOUT_MS = 5000

export type CleanableZipWorkerApi = {
  workerApi: {
    open: ZipWorkerApi['open']
    add: ZipWorkerApi['add']
    finish: ZipWorkerApi['finish']
  }
  cleanup: () => void
  abort: () => void
}

export const makeZipWorkerApiAndCleanup = (): CleanableZipWorkerApi => {
  const worker = new ZipWorker()
  const remote = wrap<ZipWorkerApi>(worker)
  let isCleanedUp = false

  const cleanup = () => {
    if (isCleanedUp) return
    isCleanedUp = true
    remote[releaseProxy]()
    worker.terminate()
  }

  // Comlink never settles a call to a worker that failed to load or crashed
  const workerFailed = new Promise<never>((_, reject) => {
    const onError = (event: Event) => {
      reject(
        new Error(
          event instanceof ErrorEvent && event.message
            ? `Zip worker failed: ${event.message}`
            : 'Zip worker failed',
        ),
      )
      cleanup()
    }
    worker.addEventListener('error', onError)
    worker.addEventListener('messageerror', onError)
  })
  workerFailed.catch(() => undefined)
  const call = <T>(promise: Promise<T>) => Promise.race([promise, workerFailed])

  const workerApi = {
    open: () => call(remote.open()),
    add: (entries: ZipEntry[]) => call(remote.add(entries)),
    finish: () => call(remote.finish()),
  }

  const abort = () => {
    if (isCleanedUp) return
    Promise.race([call(remote.abort()), waitForMs(ZIP_ABORT_TIMEOUT_MS)])
      .catch(() => undefined)
      .finally(cleanup)
  }

  return { workerApi, cleanup, abort }
}

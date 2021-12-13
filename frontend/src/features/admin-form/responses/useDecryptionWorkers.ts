import { useCallback, useState } from 'react'
import { wrap } from 'comlink'
// Need to use inline loading in order to use comlink syntax
// Typescript documentation for worker-loader webpack v4 also seems outdated,
// loading the worker script via webpack config no longer works
// eslint-disable-next-line import/no-webpack-loader-syntax
import DecryptionWorker from 'worker-loader!./workers/decryption.worker'

import { WorkerInterface } from './workers/type/workerinterface'
import { killWorkers } from './AdminSubmissionsService'

const useDecryptionWorkers = () => {
  const [workers, setWorkers] = useState<WorkerInterface[]>([])

  const downloadEncryptedResponses = useCallback(
    (formId: string, formTitle: string, secretKey: string) => {
      if (workers.length) killWorkers(workers)

      const numWorkers = window.navigator.hardwareConcurrency || 4

      const workerPool: WorkerInterface[] = []

      // Workerpool sample setup
      for (let i = 0; i < numWorkers; i++) {
        const worker = new DecryptionWorker()
        const workerApi =
          wrap<import('./workers/decryption.worker').DecryptionWorker>(worker)
        workerPool.push({ worker, workerApi })
      }

      setWorkers(workerPool)

      // TO DO: Implementation of decrypting and downloading responses in later PRs

      Promise.all(
        workerPool.map(async (worker: WorkerInterface, idx: number) => {
          console.log(await worker.workerApi.log(idx), ' finished running!')
          return worker
        }),
      ).then((workers) => {
        killWorkers(workers)
        setWorkers([])
        console.log('Terminated workers!')
      })
    },
    [workers],
  )

  return { downloadEncryptedResponses }
}

export default useDecryptionWorkers

import { Remote } from 'comlink'
// Need to use inline loading in order to use comlink syntax
// Typescript documentation for worker-loader webpack v4 also seems outdated,
// loading the worker script via webpack config no longer works
// eslint-disable-next-line import/no-webpack-loader-syntax
import DecryptionWorker from 'worker-loader!./workers/decryption.worker'

export interface WorkerInterface {
  worker: DecryptionWorker
  workerApi: Remote<{
    log: (id: number) => Promise<string>
  }>
}

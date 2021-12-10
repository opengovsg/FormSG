import React, { useState } from 'react'
import { useParams } from 'react-router'
import { Skeleton } from '@chakra-ui/react'
import { wrap } from 'comlink'
// Need to use inline loading in order to use comlink syntax
// Typescript documentation for worker-loader webpack v4 also seems outdated,
// loading the worker script via webpack config no longer works
// eslint-disable-next-line import/no-webpack-loader-syntax
import DecryptionWorker from 'worker-loader!./workers/decryption.worker'

import { StorageModeSubmissionMetadata } from '~shared/types/submission'

import Button from '~components/Button'

import { useAdminFormSettings } from '../settings/queries'

import { WorkerInterface } from './workers/type/workerinterface'
import { killWorkers } from './AdminSubmissionsService'
//import { downloadEncryptedResponses } from './AdminSubmissionsService'
import { useFormResponses } from './queries'

const useDecryptionWorkers = () => {
  const [workers, setWorkers] = useState<WorkerInterface[]>([])

  const downloadEncryptedResponses = (
    formId: string,
    formTitle: string,
    secretKey: string,
  ) => {
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
  }

  return { downloadEncryptedResponses }
}

const ResponsesPage = (): JSX.Element => {
  const { data: settings } = useAdminFormSettings()
  const { data, isLoading } = useFormResponses()
  const { formId } = useParams()
  const [secretKey, setSecretKey] = useState<string>('')
  const { downloadEncryptedResponses } = useDecryptionWorkers()

  return (
    <Skeleton isLoaded={!isLoading && !!data}>
      <div>
        Enter secret key:
        <input
          style={{ backgroundColor: 'grey' }}
          type="text"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
        />
        <Button
          onClick={() =>
            downloadEncryptedResponses(formId!, settings!.title, secretKey)
          }
        >
          Export csv{' '}
        </Button>
        <Button>Export csv and attachments</Button>
        {!!data &&
          data.metadata.map((submission: StorageModeSubmissionMetadata) => {
            return (
              <div key={submission.refNo}>
                Submission Ref No: {submission.refNo}
              </div>
            )
          })}
      </div>
    </Skeleton>
  )
}
export default ResponsesPage

import { useCallback } from 'react'
import { useParams } from 'react-router-dom'

import { getEncryptedResponsesStream } from './StorageResponsesService'

const useDecryptionWorkers = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const downloadEncryptedResponses = useCallback(
    async (formId: string, formTitle: string, secretKey: string) => {
      const downloadAbortController = new AbortController()

      await new Promise((resolve, reject) => {
        // TO DO: Implementation of decrypting and downloading responses in later PRs
        getEncryptedResponsesStream(
          formId,
          { downloadAttachments: false },
          downloadAbortController,
        ).then((stream) => {
          const reader = stream.getReader()
          reader.read().then(function read(result) {
            if (result.done) {
              resolve('done')
              return
            }
            console.log(result.value)
            reader.read().then(read) // recurse through the stream
          })
        })
      })
    },
    [],
  )

  return { downloadEncryptedResponses }
}

export default useDecryptionWorkers

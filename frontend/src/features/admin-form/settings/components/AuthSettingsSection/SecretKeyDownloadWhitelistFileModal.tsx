import { useCallback } from 'react'
import { useQueryClient } from 'react-query'
import { UseDisclosureReturn } from '@chakra-ui/react'
import Papa from 'papaparse'

import {
  decryptStringMessage,
  EncryptedStringsMessageContent,
} from '~shared/utils/crypto'

import { useToast } from '~hooks/useToast'
import { downloadFile } from '~components/Field/Attachment/utils/downloadFile'

import { fetchAdminFormEncryptedWhitelistedSubmitterIds } from '../../queries'
import { SecretKeyFormModal } from '../SecretKeyFormModal'

export interface SecretKeyDownloadWhitelistFileModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  publicKey: string
  formId: string
  downloadFileName: string
}

export const SecretKeyDownloadWhitelistFileModal = ({
  onClose,
  isOpen,
  publicKey,
  downloadFileName,
  formId,
}: SecretKeyDownloadWhitelistFileModalProps) => {
  const toast = useToast({ status: 'success', isClosable: true })
  const errorToast = useToast({ status: 'danger', isClosable: true })

  const queryClient = useQueryClient()

  const toastErrorMessage = useCallback(
    (errorMessage: string) => {
      errorToast.closeAll()
      errorToast({
        description: errorMessage,
      })
    },
    [errorToast],
  )
  const toastSuccessMessage = useCallback(
    (message: string) => {
      toast.closeAll()
      toast({
        description: message,
      })
    },
    [toast],
  )

  const decryptSubmitterIds = useCallback(
    (
      encryptedSubmitterIdContent: EncryptedStringsMessageContent,
      secretKey: string,
    ) => {
      return decryptStringMessage(secretKey, encryptedSubmitterIdContent)
    },
    [],
  )
  const handleWhitelistCsvDownload = useCallback(
    ({ secretKey }: { secretKey: string }) => {
      fetchAdminFormEncryptedWhitelistedSubmitterIds(formId, queryClient)
        .then((data) => {
          const { encryptedWhitelistedSubmitterIds } = data
          if (
            encryptedWhitelistedSubmitterIds &&
            encryptedWhitelistedSubmitterIds.myPublicKey &&
            encryptedWhitelistedSubmitterIds.nonce &&
            encryptedWhitelistedSubmitterIds.cipherTexts &&
            encryptedWhitelistedSubmitterIds.cipherTexts.length > 0
          ) {
            const decryptedSubmitterIds = decryptSubmitterIds(
              encryptedWhitelistedSubmitterIds,
              secretKey,
            )
            const submitterIds = decryptedSubmitterIds.filter(
              (id) => id !== null,
            )
            if (!submitterIds || submitterIds.length === 0) {
              return
            }

            // generate and download csv file
            const csvData = submitterIds.map((submitterId) => ({
              Respondent: submitterId,
            }))
            const csvString = Papa.unparse(csvData, {
              header: true,
              delimiter: ',',
              skipEmptyLines: 'greedy',
            })
            const csvBlob = new Blob([csvString], {
              type: 'text/csv',
            })
            const csvFile = new File([csvBlob], downloadFileName, {
              type: 'text/csv',
            })
            downloadFile(csvFile)
            onClose()
            toastSuccessMessage(
              'Whitelist setting file downloaded successfully',
            )
          } else {
            toastErrorMessage('Whitelist settings could not be decrypted')
          }
        })
        .catch((error: Error) => {
          toastErrorMessage(error.message)
        })
    },
    [
      formId,
      queryClient,
      decryptSubmitterIds,
      downloadFileName,
      onClose,
      toastSuccessMessage,
      toastErrorMessage,
    ],
  )

  return (
    <SecretKeyFormModal
      isLoading={false}
      onSubmit={handleWhitelistCsvDownload}
      onClose={onClose}
      isOpen={isOpen}
      publicKey={publicKey}
      modalActionText="Download CSV file of whitelisted NRIC/FIN/UEN(s)"
      submitButtonText="Download file"
      hasAck={false}
    />
  )
}

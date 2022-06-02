import { createContext, useContext } from 'react'

export type DownloadEncryptedParams = {
  // ID for the form to download responses for.
  formId: string
  // Title of the form
  formTitle: string
  // The specific start date to filter for file responses.
  startDate?: string
  // The specific end date to filter for file responses.
  endDate?: string
  // The key to decrypt the submission responses.
  secretKey: string
}

export interface StorageResponsesContextProps {
  secretKey?: string
  setSecretKey: (secretKey: string) => void
  downloadParams: DownloadEncryptedParams | null
  responsesCount?: number
  formPublicKey: string | null
  isLoading: boolean
}

export const StorageResponsesContext = createContext<
  StorageResponsesContextProps | undefined
>(undefined)

export const useStorageResponsesContext = (): StorageResponsesContextProps => {
  const context = useContext(StorageResponsesContext)
  if (!context) {
    throw new Error(
      `useStorageResponsesContext must be used within a StorageResponsesProvider component`,
    )
  }
  return context
}

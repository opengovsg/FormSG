import { createContext, useContext } from 'react'

import { DateString } from '~shared/types'

import { DownloadEncryptedParams } from './useDecryptionWorkers'

export interface StorageResponsesContextProps {
  secretKey?: string
  setSecretKey: (secretKey: string) => void
  dateRange: DateString[]
  setDateRange: (dateRange: DateString[]) => void
  downloadParams: Omit<DownloadEncryptedParams, 'downloadAttachments'> | null
  totalResponsesCount?: number
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

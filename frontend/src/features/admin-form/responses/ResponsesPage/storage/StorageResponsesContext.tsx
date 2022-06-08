import { createContext, useContext } from 'react'

export interface StorageResponsesContextProps {
  secretKey?: string
  setSecretKey: (secretKey: string) => void
  handleExportCsv: () => void
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

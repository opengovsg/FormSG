import { createContext, useContext } from 'react'

export interface ResponsesContextProps {
  secretKey?: string
  setSecretKey: (secretKey: string) => void
  handleExportCsv: () => void
  responsesCount?: number
  formPublicKey: string | null
  isLoading: boolean
}

export const ResponsesContext = createContext<
  ResponsesContextProps | undefined
>(undefined)

export const useResponsesContext = (): ResponsesContextProps => {
  const context = useContext(ResponsesContext)
  if (!context) {
    throw new Error(
      `useResponsesContext must be used within a ResponsesProvider component`,
    )
  }
  return context
}

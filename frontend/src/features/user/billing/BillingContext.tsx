import { createContext, useContext } from 'react'

export interface BillingContextProps {
  eServiceID?: string
  setEServiceID: (eServiceID: string) => void
  //downloadParams: Omit<DownloadEncryptedParams, 'downloadAttachments'> | null
  isLoading: boolean
}

export const BillingContext = createContext<BillingContextProps | undefined>(
  undefined,
)

export const useBillingContext = (): BillingContextProps => {
  const context = useContext(BillingContext)
  if (!context) {
    throw new Error(
      `useBillingContext must be used within a BillingProvider component`,
    )
  }
  return context
}

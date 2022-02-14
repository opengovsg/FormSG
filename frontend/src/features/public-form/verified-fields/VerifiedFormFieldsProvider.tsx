import { VerifiedFormFieldsContext } from './VerifiedFormFieldsContext'

export interface VerifiedFormFieldsProviderProps {
  children: React.ReactNode
}

export const VerifiedFormFieldsProvider = ({
  children,
}: VerifiedFormFieldsProviderProps): JSX.Element => {
  return (
    <VerifiedFormFieldsContext.Provider value={{}}>
      {children}
    </VerifiedFormFieldsContext.Provider>
  )
}

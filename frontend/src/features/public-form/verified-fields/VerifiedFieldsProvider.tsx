import { VerifiedFieldsContext } from './VerifiedFieldsContext'

export interface VerifiedFieldsProviderProps {
  children: React.ReactNode
}

export const VerifiedFieldsProvider = ({
  children,
}: VerifiedFieldsProviderProps): JSX.Element => {
  return (
    <VerifiedFieldsContext.Provider value={{}}>
      {children}
    </VerifiedFieldsContext.Provider>
  )
}

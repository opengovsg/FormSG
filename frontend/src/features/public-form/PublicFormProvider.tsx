import { useRef } from 'react'

import { PublicFormContext } from './PublicFormContext'

interface PublicFormProviderProps {
  children: React.ReactNode
}

export const PublicFormProvider = ({
  children,
}: PublicFormProviderProps): JSX.Element => {
  const miniHeaderRef = useRef<HTMLDivElement>(null)

  return (
    <PublicFormContext.Provider value={{ miniHeaderRef }}>
      {children}
    </PublicFormContext.Provider>
  )
}

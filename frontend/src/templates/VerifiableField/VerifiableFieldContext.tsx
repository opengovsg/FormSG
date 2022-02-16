import { createContext, useContext } from 'react'
import { ControllerRenderProps } from 'react-hook-form'

import { createBaseVfnFieldValidationRules } from '~utils/fieldValidation'

interface VerifiableFieldContextReturn {
  baseVfnValidationRules: ReturnType<typeof createBaseVfnFieldValidationRules>
  isVfnBoxOpen: boolean
  handleInputChange: (
    onChange: ControllerRenderProps['onChange'],
  ) => (value?: string) => void
  handleVfnButtonClick: () => void
  handleVfnSuccess: (signature: string) => Promise<void>
  handleResendOtp: () => Promise<void>
  hasSignature: boolean
}

export const VerifiableFieldContext = createContext<
  VerifiableFieldContextReturn | undefined
>(undefined)

export const useVerifiableField = (): VerifiableFieldContextReturn => {
  const context = useContext(VerifiableFieldContext)
  if (!context) {
    throw new Error(
      'useVerifiableField must be used within a VerifiableFieldProvider',
    )
  }
  return context
}

import { createContext, useContext } from 'react'
import { ControllerRenderProps } from 'react-hook-form'

interface VerifiableFieldContextReturn {
  isVfnBoxOpen: boolean
  otpPrefix: string
  handleInputChange: (
    onChange: ControllerRenderProps['onChange'],
  ) => (value?: string) => void
  handleVfnButtonClick: () => void
  handleVerifyOtp: (otp: string) => Promise<string>
  handleResendOtp: () => Promise<void>
  hasSignature: boolean
  isSendingOtp: boolean
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

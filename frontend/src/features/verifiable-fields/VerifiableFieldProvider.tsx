import { useCallback, useState } from 'react'
import {
  ControllerRenderProps,
  useFormContext,
  useWatch,
} from 'react-hook-form'

import { FormFieldWithId } from '~shared/types/field'

import { useTimeout } from '~hooks/useTimeout'
import { BaseFieldProps } from '~templates/Field/FieldContainer'
import { VerifiableFieldInput } from '~templates/Field/types'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useVerifiableFieldMutations } from './mutations'
import { VerifiableFieldBase, VerifiableFieldSchema } from './types'
import { VerifiableFieldContext } from './VerifiableFieldContext'

export interface VerifiableFieldProps extends BaseFieldProps {
  /** Verifiable schema this field is wrapping over */
  schema: VerifiableFieldSchema<FormFieldWithId<VerifiableFieldBase>>
  /**
   * Callback function to check whether current input is a valid input.
   * Will be triggered when the "Verify" button is clicked.
   * If the callback returns true, verification API will be triggered,
   * else the returned string will be displayed as an error.
   */
  validateInputForVfn: (input?: string) => string | true
}

export interface VerifiableFieldProviderProps extends VerifiableFieldProps {
  children: React.ReactNode
}

export const VerifiableFieldProvider = ({
  schema,
  children,
  validateInputForVfn,
}: VerifiableFieldProviderProps): JSX.Element => {
  const [isVfnBoxOpen, setIsVfnBoxOpen] = useState(false)
  const [otpPrefix, setOtpPrefix] = useState('')

  const { control, setError, getValues, setValue, setFocus } =
    useFormContext<VerifiableFieldInput>()
  const currentSignature = useWatch({
    name: `${schema._id}.signature`,
    control,
  })

  const { formId, getTransactionId, expiryInMs } = usePublicFormContext()

  const {
    triggerSendOtpMutation,
    triggerResendOtpMutation,
    verifyOtpMutation,
  } = useVerifiableFieldMutations({
    schema,
    formId,
    getTransactionId,
  })

  /**
   * Keeps track of already completed numbers to signatures
   */
  const [mapNumberToSignature, setMapNumberToSignature] = useState<
    Record<string, string>
  >({})

  useTimeout(() => {
    // Reset signatures and map values.
    setValue(
      schema._id,
      { value: getValues(schema._id)?.value },
      { shouldValidate: true },
    )
    setIsVfnBoxOpen(false)
    setMapNumberToSignature({})
  }, expiryInMs)

  const handleInputChange = useCallback(
    (onChange: ControllerRenderProps['onChange']) => (value?: string) => {
      // Prevent action when multiple onChange is called with the same value
      // This can happen when input is blurred, since onChange is also called by
      // react-hook-form when that happens.
      if (getValues(schema._id)?.value === value) return

      // If the input changes then the user needs to request re-verification,
      // and the vfn box should be hidden.
      if (isVfnBoxOpen) {
        setIsVfnBoxOpen(false)
      }
      if (!value) {
        return onChange({ value })
      }

      // If the current input corresponds to a signature, update the signature
      // value of this field.
      const signature = mapNumberToSignature[value ?? '']
      return onChange({ value, signature })
    },
    [getValues, isVfnBoxOpen, mapNumberToSignature, schema._id],
  )

  const handleResendOtp = useCallback(async () => {
    const currentInputValue = getValues(schema._id)?.value
    // Should not happen, but guarding against this just in case.
    if (!currentInputValue) return

    return triggerResendOtpMutation.mutate(currentInputValue, {
      onSuccess: ({ otpPrefix }) => setOtpPrefix(otpPrefix),
    })
  }, [getValues, schema._id, triggerResendOtpMutation])

  const handleVfnButtonClick = useCallback(() => {
    const currentInputValue = getValues(schema._id)?.value
    if (!currentInputValue) {
      return setError(
        schema._id,
        { message: 'Please fill in the field before attempting verification' },
        { shouldFocus: true },
      )
    }

    // Do nothing if box is already opened, or there is already a signature linked to the input.
    if (isVfnBoxOpen || mapNumberToSignature[currentInputValue]) return

    // Only trigger send otp if the input is a valid input.
    const validateResult = validateInputForVfn(currentInputValue)
    if (validateResult === true) {
      return triggerSendOtpMutation.mutate(currentInputValue, {
        onSuccess: ({ otpPrefix }) => {
          setIsVfnBoxOpen(true)
          setOtpPrefix(otpPrefix)
        },
      })
    }

    // Else invalid input.
    return setError(
      schema._id,
      { message: validateResult },
      { shouldFocus: true },
    )
  }, [
    getValues,
    isVfnBoxOpen,
    mapNumberToSignature,
    schema._id,
    setError,
    triggerSendOtpMutation,
    validateInputForVfn,
  ])

  const handleVerifyOtp = useCallback(
    (otp: string) => {
      // async so verification box can show error message
      return verifyOtpMutation.mutateAsync(otp, {
        onSuccess: (signature) => {
          const currentValue = getValues(schema._id)?.value
          if (!currentValue) return
          setValue(
            schema._id,
            {
              value: currentValue,
              signature,
            },
            { shouldValidate: true },
          )
          // Add signature to map.
          setMapNumberToSignature((prev) => ({
            ...prev,
            [currentValue]: signature,
          }))
          // Refocus back to initial field on success.
          setFocus(schema._id)
          setIsVfnBoxOpen(false)
        },
      })
    },
    [getValues, schema._id, setFocus, setValue, verifyOtpMutation],
  )

  return (
    <VerifiableFieldContext.Provider
      value={{
        isVfnBoxOpen,
        otpPrefix,
        handleInputChange,
        handleVfnButtonClick,
        handleResendOtp,
        handleVerifyOtp,
        hasSignature: !!currentSignature,
        isSendingOtp: triggerSendOtpMutation.isLoading,
      }}
    >
      {children}
    </VerifiableFieldContext.Provider>
  )
}

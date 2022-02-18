import { useCallback, useState } from 'react'
import {
  ControllerRenderProps,
  useFormContext,
  useWatch,
} from 'react-hook-form'

import { FormFieldWithId } from '~shared/types/field'
import { isMobilePhoneNumber } from '~shared/utils/phone-num-validation'

import { BaseFieldProps } from '~templates/Field/FieldContainer'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useVerifiableFieldMutations } from './mutations'
import {
  VerifiableFieldBase,
  VerifiableFieldInput,
  VerifiableFieldSchema,
} from './types'
import { VerifiableFieldContext } from './VerifiableFieldContext'

export interface VerifiableFieldProps extends BaseFieldProps {
  schema: VerifiableFieldSchema<FormFieldWithId<VerifiableFieldBase>>
}

export interface VerifiableFieldProviderProps extends VerifiableFieldProps {
  children: React.ReactNode
}

export const VerifiableFieldProvider = ({
  schema,
  children,
}: VerifiableFieldProviderProps): JSX.Element => {
  const [isVfnBoxOpen, setIsVfnBoxOpen] = useState(false)

  const { control, setError, getValues, setValue, setFocus, clearErrors } =
    useFormContext()
  const currentSignature: VerifiableFieldInput = useWatch({
    name: `${schema._id}.signature`,
    control,
  })

  const { formId, getTransactionId } = usePublicFormContext()

  const { triggerSendOtpMutation } = useVerifiableFieldMutations({
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

  const handleInputChange = useCallback(
    (onChange: ControllerRenderProps['onChange']) => (value?: string) => {
      // Prevent action when multiple onChange is called with the same value
      // This can happen when input is blurred, since onChange is also called by
      // react-hook-form when that happen.
      if (getValues(schema._id)?.value === value) return
      if (isVfnBoxOpen) {
        setIsVfnBoxOpen(false)
      }
      if (!value) {
        return onChange({ value })
      }
      const signature = mapNumberToSignature[value ?? '']
      return onChange({ value, signature })
    },
    [getValues, isVfnBoxOpen, mapNumberToSignature, schema._id],
  )

  // TODO: Extract this based on schema type instead of hardcoding to mobile field
  const handleVfnButtonClick = useCallback(() => {
    const currentInputValue = getValues(schema._id)?.value
    if (!currentInputValue) {
      return setError(
        schema._id,
        { message: 'Please fill in field before attempting verification' },
        { shouldFocus: true },
      )
    } else {
      clearErrors(schema._id)
    }

    // Do nothing if box is already opened.
    if (isVfnBoxOpen) return

    // Check is valid phone number
    if (isMobilePhoneNumber(currentInputValue)) {
      return triggerSendOtpMutation.mutate(currentInputValue, {
        onSuccess: () => setIsVfnBoxOpen(true),
      })
    }

    // Else invalid input.
    return setError(
      schema._id,
      { message: 'Please enter a valid mobile number' },
      { shouldFocus: true },
    )
  }, [
    clearErrors,
    getValues,
    isVfnBoxOpen,
    schema._id,
    setError,
    triggerSendOtpMutation,
  ])

  const handleVfnSuccess = useCallback(
    async (signature: string) => {
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
    [getValues, schema._id, setFocus, setValue],
  )

  const handleResendOtp = useCallback(() => {
    // TODO: Add API call to resend OTP
    return Promise.resolve(console.log('resending'))
  }, [])

  return (
    <VerifiableFieldContext.Provider
      value={{
        isVfnBoxOpen,
        handleInputChange,
        handleVfnButtonClick,
        handleResendOtp,
        handleVfnSuccess,
        hasSignature: !!currentSignature,
        isSendingOtp: triggerSendOtpMutation.isLoading,
      }}
    >
      {children}
    </VerifiableFieldContext.Provider>
  )
}

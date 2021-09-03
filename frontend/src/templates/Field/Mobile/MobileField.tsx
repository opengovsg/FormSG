/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Controller,
  ControllerRenderProps,
  useFormContext,
} from 'react-hook-form'
import { chakra, Flex, Stack } from '@chakra-ui/react'

import { FormFieldWithId, MobileFieldBase } from '~shared/types/field'

import { createMobileValidationRules } from '~utils/fieldValidation'
import Button from '~components/Button'
import PhoneNumberInput from '~components/PhoneNumberInput'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

import { VerificationBox } from './components/VerificationBox'

export type MobileFieldSchema = FormFieldWithId<MobileFieldBase>
export interface MobileFieldProps extends BaseFieldProps {
  schema: MobileFieldSchema
}

export const MobileField = ({
  schema,
  questionNumber,
}: MobileFieldProps): JSX.Element => {
  const [mapNumberToSignature, setMapNumberToSignature] = useState<
    Record<string, string>
  >({})
  const [isVfnOpen, setIsVfnOpen] = useState(false)
  const fieldValueName = useMemo(() => `${schema._id}.fieldValue`, [schema._id])
  const signatureName = useMemo(() => `${schema._id}.signature`, [schema._id])

  const { setValue, watch, setFocus, register, trigger, getValues } =
    useFormContext()
  const currentInput = watch(fieldValueName)
  const hasSavedSignature = !!mapNumberToSignature[currentInput]

  // Revalidate signature field whenever there is a saved signature.
  useEffect(() => {
    if (hasSavedSignature) {
      trigger(signatureName, {
        shouldFocus: true,
      })
    }
  }, [hasSavedSignature, signatureName, trigger])

  const mobileValidationRules = useMemo(
    () => createMobileValidationRules(schema),
    [schema],
  )

  const verifiedValidationRules = useMemo(() => {
    return {
      validate: {
        required: (val: string) => {
          // Either signature is filled, or both fields have no input.
          if (!!val || (!getValues(fieldValueName) && !val)) {
            return true
          }
          return 'You need to verify'
        },
      },
    }
  }, [fieldValueName, getValues])

  const onVerificationSuccess = useCallback(
    (signature: string) => {
      setValue(signatureName, signature, { shouldValidate: true })
      // Add signature to map.
      if (currentInput) {
        setMapNumberToSignature((prev) => ({
          ...prev,
          [currentInput]: signature,
        }))
      }
    },
    [currentInput, setValue, signatureName],
  )

  const handleInputChange = useCallback(
    (onChange: ControllerRenderProps['onChange']) => (val?: string) => {
      if (isVfnOpen) {
        setIsVfnOpen(false)
      }
      onChange(val)
      // Unable to use some memoized savedSignature constant, will not set
      // properly; suspect useCallback not recreating function on savedSignature
      // changes.
      const signature = mapNumberToSignature[val ?? '']
      setValue(signatureName, signature, {
        // Only validate if there is signature
        shouldValidate: !!signature,
      })
    },
    [isVfnOpen, mapNumberToSignature, setValue, signatureName],
  )

  const handleVfnButtonClick = useCallback(async () => {
    const result = await trigger(fieldValueName, {
      shouldFocus: true,
    })
    if (result && !isVfnOpen) {
      setIsVfnOpen(true)
    }
  }, [fieldValueName, isVfnOpen, trigger])

  return (
    <Stack>
      <FieldContainer schema={schema} questionNumber={questionNumber}>
        <Controller
          rules={mobileValidationRules}
          name={fieldValueName}
          render={({ field: { onChange, ...rest } }) => {
            return (
              <Flex>
                <PhoneNumberInput
                  {...rest}
                  isAllowInternational={schema.allowIntlNumbers}
                  onChange={handleInputChange(onChange)}
                />
                {schema.isVerifiable && (
                  <>
                    {/* Virtual input to capture signature for verified fields */}
                    <chakra.input
                      readOnly
                      w={0}
                      tabIndex={-1}
                      aria-hidden
                      {...register(signatureName, verifiedValidationRules)}
                      onFocus={() => setFocus(fieldValueName)}
                    />
                    <Button
                      ml="0.5rem"
                      onClick={handleVfnButtonClick}
                      colorScheme={hasSavedSignature ? 'success' : 'primary'}
                    >
                      {hasSavedSignature ? 'Verified' : 'Verify'}
                    </Button>
                  </>
                )}
              </Flex>
            )
          }}
        />
      </FieldContainer>
      {isVfnOpen && !hasSavedSignature && (
        <VerificationBox onSuccess={onVerificationSuccess} />
      )}
    </Stack>
  )
}

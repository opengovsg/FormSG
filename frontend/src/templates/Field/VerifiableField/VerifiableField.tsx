/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { ControllerRenderProps, useFormContext } from 'react-hook-form'
import { BiCheck } from 'react-icons/bi'
import { Box, chakra, Stack, VisuallyHidden } from '@chakra-ui/react'

import {
  EmailFieldBase,
  FormFieldWithId,
  MobileFieldBase,
} from '~shared/types/field'

import Button from '~components/Button'
import FormFieldMessage from '~components/FormControl/FormFieldMessage'

import { FieldContainer, FieldContainerProps } from '../FieldContainer'

import { VerificationBox } from './components/VerificationBox'

export interface VerifiableFieldProps extends FieldContainerProps {
  schema: FormFieldWithId<MobileFieldBase | EmailFieldBase>
}

type VerifiableFieldContextProps = {
  handleInputChange: (
    onChange: ControllerRenderProps['onChange'],
  ) => (val?: string | undefined) => void
  handleVfnButtonClick: () => Promise<void>
  fieldValueName: string
}
export const VerifiableFieldContext = createContext<
  VerifiableFieldContextProps | undefined
>(undefined)

export const VerifiableField = ({
  schema,
  questionNumber,
  children,
}: VerifiableFieldProps): JSX.Element => {
  const [mapNumberToSignature, setMapNumberToSignature] = useState<
    Record<string, string>
  >({})
  const [isAllowVfnOpen, setIsAllowVfnOpen] = useState(false)
  const fieldValueName = useMemo(() => `${schema._id}.fieldValue`, [schema._id])
  const signatureName = useMemo(() => `${schema._id}.signature`, [schema._id])

  const { setValue, watch, setFocus, register, trigger, getValues, setError } =
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
      // Refocus back to initial field on success.
      setFocus(fieldValueName)
    },
    [currentInput, fieldValueName, setFocus, setValue, signatureName],
  )

  const handleInputChange = useCallback(
    (onChange: ControllerRenderProps['onChange']) => (val?: string) => {
      onChange(val)
      if (schema.isVerifiable) {
        if (isAllowVfnOpen) {
          setIsAllowVfnOpen(false)
        }
        // Unable to use some memoized savedSignature constant, will not set
        // properly; suspect useCallback not recreating function on savedSignature
        // changes.
        const signature = mapNumberToSignature[val ?? '']
        setValue(signatureName, signature, {
          // Only validate if there is signature
          shouldValidate: !!signature,
        })
      }
    },
    [
      isAllowVfnOpen,
      mapNumberToSignature,
      schema.isVerifiable,
      setValue,
      signatureName,
    ],
  )

  const handleVfnButtonClick = useCallback(async () => {
    if (!getValues(fieldValueName)) {
      return setError(
        fieldValueName,
        { message: 'Please fill in field before attempting verification' },
        { shouldFocus: true },
      )
    }
    const result = await trigger(fieldValueName, {
      shouldFocus: true,
    })
    if (result && !isAllowVfnOpen) {
      setIsAllowVfnOpen(true)
    }
  }, [fieldValueName, getValues, isAllowVfnOpen, setError, trigger])

  return (
    <VerifiableFieldContext.Provider
      value={{ handleInputChange, fieldValueName, handleVfnButtonClick }}
    >
      <FieldContainer schema={schema} questionNumber={questionNumber}>
        <Stack spacing="0.5rem" direction={{ base: 'column', md: 'row' }}>
          {children}
          {schema.isVerifiable && (
            <>
              {/* Virtual input to capture signature for verified fields */}
              <chakra.input
                readOnly
                pos="absolute"
                w={0}
                tabIndex={-1}
                aria-hidden
                {...register(signatureName, verifiedValidationRules)}
                onFocus={() => setFocus(fieldValueName)}
              />
              <Box>
                <Button
                  disabled={isAllowVfnOpen || hasSavedSignature}
                  onClick={handleVfnButtonClick}
                  leftIcon={
                    hasSavedSignature ? (
                      <BiCheck fontSize="1.5rem" />
                    ) : undefined
                  }
                >
                  {hasSavedSignature ? 'Verified' : 'Verify'}
                </Button>
              </Box>
              <VisuallyHidden>
                <FormFieldMessage>
                  {hasSavedSignature
                    ? 'This field has been successfully verified'
                    : 'This field requires verification. Please click the verify button next to this field to verify the field'}
                </FormFieldMessage>
              </VisuallyHidden>
            </>
          )}
        </Stack>
      </FieldContainer>
      {isAllowVfnOpen && !hasSavedSignature && (
        <VerificationBox
          fieldType={schema.fieldType}
          onSuccess={onVerificationSuccess}
        />
      )}
    </VerifiableFieldContext.Provider>
  )
}

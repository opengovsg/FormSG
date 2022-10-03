import { useMemo } from 'react'
import { Box, VisuallyHidden } from '@chakra-ui/react'

import { baseMobileValidationFn } from '~utils/fieldValidation'
import { MobileFieldInput, MobileFieldProps } from '~templates/Field/Mobile'
import { MobileFieldSchema } from '~templates/Field/types'

import { VerifiableFieldContainer } from '../components/VerifiableFieldContainer'
import { VerifiableFieldSchema } from '../types'
import { useVerifiableField } from '../VerifiableFieldContext'
import { VerifiableFieldProvider } from '../VerifiableFieldProvider'

export type VerifiableMobileFieldSchema =
  VerifiableFieldSchema<MobileFieldSchema>

export interface VerifiableMobileFieldProps extends MobileFieldProps {
  schema: VerifiableMobileFieldSchema
}

/**
 * @example
 * { value: '+65 9876 5432', signature: some-signature }
 */
const InnerVerifiableMobileField = ({
  schema,
  ...formContainerProps
}: VerifiableMobileFieldProps): JSX.Element => {
  const { handleInputChange, handleVfnButtonClick, hasSignature } =
    useVerifiableField()
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      // Attempt to open verification box on enter.
      handleVfnButtonClick()
    }
  }

  const a11yLabel = useMemo(() => {
    if (hasSignature) {
      return 'This input field has been successfully verified.'
    }
    return 'This is an input field which requires verification. After entering your mobile phone number, please click on the Verify button. You will receive a one-time password via SMS, which you can enter in the verification input field.'
  }, [hasSignature])

  return (
    <VerifiableFieldContainer schema={schema} {...formContainerProps}>
      <Box w="100%">
        <VisuallyHidden id={`verifiable-description-${schema._id}`}>
          {a11yLabel}
        </VisuallyHidden>
        <MobileFieldInput
          schema={schema}
          handleInputChange={handleInputChange}
          phoneNumberInputProps={{
            isSuccess: hasSignature,
            onKeyDown: handleKeyDown,
            'aria-describedby': `verifiable-description-${schema._id}`,
          }}
        />
      </Box>
    </VerifiableFieldContainer>
  )
}

export const VerifiableMobileField = ({
  schema,
  ...props
}: VerifiableMobileFieldProps) => {
  const validateInputForVfn = baseMobileValidationFn(schema)
  return (
    <VerifiableFieldProvider
      schema={schema}
      validateInputForVfn={validateInputForVfn}
    >
      <InnerVerifiableMobileField schema={schema} {...props} />
    </VerifiableFieldProvider>
  )
}

import { useMemo } from 'react'
import { Box, VisuallyHidden } from '@chakra-ui/react'

import { baseEmailValidationFn } from '~utils/fieldValidation'
import { EmailFieldInput, EmailFieldProps } from '~templates/Field/Email'
import { EmailFieldSchema } from '~templates/Field/types'

import { VerifiableFieldContainer } from '../components/VerifiableFieldContainer'
import { VerifiableFieldSchema } from '../types'
import { useVerifiableField } from '../VerifiableFieldContext'
import { VerifiableFieldProvider } from '../VerifiableFieldProvider'

export type VerifiableEmailFieldSchema = VerifiableFieldSchema<EmailFieldSchema>

export interface VerifiableEmailFieldProps extends EmailFieldProps {
  schema: VerifiableEmailFieldSchema
}

/**
 * @example
 * { value: '+65 9876 5432', signature: some-signature }
 */
const InnerVerifiableEmailField = ({
  schema,
  ...formContainerProps
}: VerifiableEmailFieldProps): JSX.Element => {
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
    return 'This is an input field which requires verification. After entering your email address, please click on the Verify button. You will receive a one-time password, which you can enter in the verification input field.'
  }, [hasSignature])

  return (
    <VerifiableFieldContainer schema={schema} {...formContainerProps}>
      <Box w="100%">
        <VisuallyHidden id={`verifiable-description-${schema._id}`}>
          {a11yLabel}
        </VisuallyHidden>
        <EmailFieldInput
          schema={schema}
          handleInputChange={handleInputChange}
          inputProps={{
            isSuccess: hasSignature,
            onKeyDown: handleKeyDown,
            'aria-describedby': `verifiable-description-${schema._id}`,
          }}
        />
      </Box>
    </VerifiableFieldContainer>
  )
}

export const VerifiableEmailField = ({
  schema,
  ...props
}: VerifiableEmailFieldProps) => {
  const validateInputForVfn = baseEmailValidationFn(schema)
  return (
    <VerifiableFieldProvider
      schema={schema}
      validateInputForVfn={validateInputForVfn}
    >
      <InnerVerifiableEmailField schema={schema} {...props} />
    </VerifiableFieldProvider>
  )
}

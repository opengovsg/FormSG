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
  const { handleInputChange, handleVfnButtonClick } = useVerifiableField()
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      // Attempt to open verification box on enter.
      handleVfnButtonClick()
    }
  }
  return (
    <VerifiableFieldContainer schema={schema} {...formContainerProps}>
      <EmailFieldInput
        schema={schema}
        handleInputChange={handleInputChange}
        inputProps={{
          onKeyDown: handleKeyDown,
        }}
      />
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

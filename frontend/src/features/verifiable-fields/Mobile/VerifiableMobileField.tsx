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
      <MobileFieldInput
        schema={schema}
        handleInputChange={handleInputChange}
        phoneNumberInputProps={{
          onKeyDown: handleKeyDown,
        }}
      />
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

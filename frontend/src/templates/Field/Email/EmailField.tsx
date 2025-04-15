import { InputProps } from '~components/Input'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { EmailFieldSchema } from '../types'

import { EmailFieldInput } from './EmailFieldInput'

export interface EmailFieldProps extends BaseFieldProps {
  schema: EmailFieldSchema
  disableRequiredValidation?: boolean
  errorVariant?: 'white'
  inputProps?: Partial<InputProps>
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const EmailField = ({
  schema,
  disableRequiredValidation,
  errorVariant,
  inputProps,
  isHighContrast,
}: EmailFieldProps): JSX.Element => {
  return (
    <FieldContainer
      schema={schema}
      errorVariant={errorVariant}
      isHighContrast={isHighContrast}
    >
      <EmailFieldInput
        schema={schema}
        disableRequiredValidation={disableRequiredValidation}
        inputProps={inputProps}
        isHighContrast={isHighContrast}
      />
    </FieldContainer>
  )
}

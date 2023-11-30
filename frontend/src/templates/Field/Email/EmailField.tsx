import { FormResponseMode } from '~shared/types'

import { InputProps } from '~components/Input'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { EmailFieldSchema } from '../types'

import { EmailFieldInput } from './EmailFieldInput'

export interface EmailFieldProps extends BaseFieldProps {
  schema: EmailFieldSchema
  responseMode: FormResponseMode
  errorVariant?: 'white'
  inputProps?: Partial<InputProps>
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const EmailField = ({
  schema,
  responseMode,
  errorVariant,
  inputProps,
}: EmailFieldProps): JSX.Element => {
  return (
    <FieldContainer schema={schema} errorVariant={errorVariant}>
      <EmailFieldInput
        schema={schema}
        responseMode={responseMode}
        inputProps={inputProps}
      />
    </FieldContainer>
  )
}

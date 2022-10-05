import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { EmailFieldSchema } from '../types'

import { EmailFieldInput } from './EmailFieldInput'

export interface EmailFieldProps extends BaseFieldProps {
  schema: EmailFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const EmailField = ({ schema }: EmailFieldProps): JSX.Element => {
  return (
    <FieldContainer schema={schema}>
      <EmailFieldInput schema={schema} />
    </FieldContainer>
  )
}

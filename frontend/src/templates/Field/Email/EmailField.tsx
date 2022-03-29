import { BaseFieldProps, FieldContainer } from '../FieldContainer'

import { EmailFieldInput } from './EmailFieldInput'
import { EmailFieldSchema } from './types'

export interface EmailFieldProps extends BaseFieldProps {
  schema: EmailFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const EmailField = ({
  schema,
  questionNumber,
}: EmailFieldProps): JSX.Element => {
  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <EmailFieldInput schema={schema} />
    </FieldContainer>
  )
}

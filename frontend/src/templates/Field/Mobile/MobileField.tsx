import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { MobileFieldSchema } from '../types'

import { MobileFieldInput } from './MobileFieldInput'

export interface MobileFieldProps extends BaseFieldProps {
  schema: MobileFieldSchema
  disableRequiredValidation?: boolean
}

export const MobileField = ({
  schema,
  disableRequiredValidation,
  language,
  ...fieldContainerProps
}: MobileFieldProps): JSX.Element => {
  return (
    <FieldContainer
      schema={schema}
      {...fieldContainerProps}
      language={language}
    >
      <MobileFieldInput
        schema={schema}
        disableRequiredValidation={disableRequiredValidation}
      />
    </FieldContainer>
  )
}

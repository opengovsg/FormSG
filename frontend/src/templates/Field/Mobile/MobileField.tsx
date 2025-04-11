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
  highContrast,
  ...fieldContainerProps
}: MobileFieldProps): JSX.Element => {
  return (
    <FieldContainer
      schema={schema}
      highContrast={highContrast}
      {...fieldContainerProps}
    >
      <MobileFieldInput
        schema={schema}
        disableRequiredValidation={disableRequiredValidation}
        highContrast={highContrast}
      />
    </FieldContainer>
  )
}

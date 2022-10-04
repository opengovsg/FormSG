import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { MobileFieldSchema } from '../types'

import { MobileFieldInput } from './MobileFieldInput'

export interface MobileFieldProps extends BaseFieldProps {
  schema: MobileFieldSchema
}

export const MobileField = ({
  schema,
  ...fieldContainerProps
}: MobileFieldProps): JSX.Element => {
  return (
    <FieldContainer schema={schema} {...fieldContainerProps}>
      <MobileFieldInput schema={schema} />
    </FieldContainer>
  )
}

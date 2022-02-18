import { BaseFieldProps, FieldContainer } from '../FieldContainer'

import { MobileFieldInput } from './MobileFieldInput'
import { MobileFieldSchema } from './types'

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

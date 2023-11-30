import { FormResponseMode } from '~shared/types'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { MobileFieldSchema } from '../types'

import { MobileFieldInput } from './MobileFieldInput'

export interface MobileFieldProps extends BaseFieldProps {
  schema: MobileFieldSchema
  responseMode: FormResponseMode
}

export const MobileField = ({
  schema,
  responseMode,
  ...fieldContainerProps
}: MobileFieldProps): JSX.Element => {
  return (
    <FieldContainer schema={schema} {...fieldContainerProps}>
      <MobileFieldInput schema={schema} responseMode={responseMode} />
    </FieldContainer>
  )
}

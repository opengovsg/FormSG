import { Language } from '~shared/types'

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
  selectedLanguage = Language.ENGLISH,
  ...fieldContainerProps
}: MobileFieldProps): JSX.Element => {
  return (
    <FieldContainer
      schema={schema}
      {...fieldContainerProps}
      selectedLanguage={selectedLanguage}
    >
      <MobileFieldInput
        schema={schema}
        disableRequiredValidation={disableRequiredValidation}
      />
    </FieldContainer>
  )
}

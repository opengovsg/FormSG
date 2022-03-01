import { useMemo } from 'react'
import { Controller } from 'react-hook-form'

import { FormFieldWithId, MobileFieldBase } from '~shared/types/field'

import { createMobileValidationRules } from '~utils/fieldValidation'
import PhoneNumberInput from '~components/PhoneNumberInput'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

export type MobileFieldSchema = FormFieldWithId<MobileFieldBase>
export interface MobileFieldProps extends BaseFieldProps {
  schema: MobileFieldSchema
}

export const MobileField = ({
  schema,
  questionNumber,
}: MobileFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createMobileValidationRules(schema),
    [schema],
  )

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Controller
        rules={validationRules}
        name={schema._id}
        render={({ field }) => (
          <PhoneNumberInput
            autoComplete="tel"
            allowInternational={schema.allowIntlNumbers}
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}

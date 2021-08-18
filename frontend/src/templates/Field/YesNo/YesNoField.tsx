import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormFieldWithId, YesNoFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~/utils/fieldValidation'

import YesNo from '~components/Field/YesNo'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

export type YesNoFieldSchema = FormFieldWithId<YesNoFieldBase>
export interface YesNoFieldProps extends BaseFieldProps {
  schema: YesNoFieldSchema
}

export const YesNoField = ({
  schema,
  questionNumber,
}: YesNoFieldProps): JSX.Element => {
  const { control } = useFormContext()

  const validationRules = useMemo(
    () => createBaseValidationRules(schema),
    [schema],
  )

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        render={({ field }) => <YesNo {...field} />}
      />
    </FieldContainer>
  )
}

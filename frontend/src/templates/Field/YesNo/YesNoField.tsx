/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormFieldWithId, YesNoFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~/utils/fieldValidation'

import YesNo from '~components/Field/YesNo'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { YesNoFieldInput } from '../types'

export type YesNoFieldSchema = FormFieldWithId<YesNoFieldBase>
export interface YesNoFieldProps extends BaseFieldProps {
  schema: YesNoFieldSchema
}

export const YesNoField = ({
  schema,
  questionNumber,
}: YesNoFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createBaseValidationRules(schema),
    [schema],
  )

  const { control } = useFormContext<YesNoFieldInput>()

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

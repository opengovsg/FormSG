/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormColorTheme } from '~shared/types'

import { createBaseValidationRules } from '~/utils/fieldValidation'

import YesNo from '~components/Field/YesNo'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { YesNoFieldInput, YesNoFieldSchema } from '../types'

export interface YesNoFieldProps extends BaseFieldProps {
  schema: YesNoFieldSchema
  disableRequiredValidation?: boolean
}

export const YesNoField = ({
  schema,
  disableRequiredValidation,
  colorTheme = FormColorTheme.Blue,
  language,
}: YesNoFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createBaseValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const { control } = useFormContext<YesNoFieldInput>()

  return (
    <FieldContainer schema={schema} language={language}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        render={({ field }) => (
          <YesNo
            colorScheme={`theme-${colorTheme}`}
            title={`${schema.questionNumber}. ${schema.title}`}
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}

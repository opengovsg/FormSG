import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { createHomeNoValidationRules } from '~utils/fieldValidation'
import PhoneNumberInput from '~components/PhoneNumberInput'
import landlineExamples from '~components/PhoneNumberInput/resources/examples.landline.json'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { HomeNoFieldSchema, SingleAnswerFieldInput } from '../types'

export interface HomeNoFieldProps extends BaseFieldProps {
  schema: HomeNoFieldSchema
  disableRequiredValidation?: boolean
}

export const HomeNoField = ({
  schema,
  disableRequiredValidation,
  language,
}: HomeNoFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createHomeNoValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} language={language}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        render={({ field }) => (
          <PhoneNumberInput
            autoComplete="tel"
            allowInternational={schema.allowIntlNumbers}
            examples={landlineExamples}
            // Remove placeholder when field is disabled, to avoid confusion if
            // the field is prefilled or not (placeholder and prefill look similar)
            examplePlaceholder={schema.disabled ? 'off' : undefined}
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}

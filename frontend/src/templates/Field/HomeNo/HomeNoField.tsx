import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormResponseMode } from '~shared/types'

import { createHomeNoValidationRules } from '~utils/fieldValidation'
import PhoneNumberInput from '~components/PhoneNumberInput'
import landlineExamples from '~components/PhoneNumberInput/resources/examples.landline.json'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { HomeNoFieldSchema, SingleAnswerFieldInput } from '../types'

export interface HomeNoFieldProps extends BaseFieldProps {
  schema: HomeNoFieldSchema
  responseMode: FormResponseMode
}

export const HomeNoField = ({
  schema,
  responseMode,
}: HomeNoFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createHomeNoValidationRules(schema, responseMode),
    [schema, responseMode],
  )

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        render={({ field }) => (
          <PhoneNumberInput
            autoComplete="tel"
            allowInternational={schema.allowIntlNumbers}
            examples={landlineExamples}
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}

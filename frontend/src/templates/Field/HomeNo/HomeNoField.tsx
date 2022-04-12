import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormFieldWithId, HomenoFieldBase } from '~shared/types/field'

import { createHomeNoValidationRules } from '~utils/fieldValidation'
import PhoneNumberInput from '~components/PhoneNumberInput'
import landlineExamples from '~components/PhoneNumberInput/resources/examples.landline.json'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { SingleAnswerFieldInput } from '../types'

export type HomeNoFieldSchema = FormFieldWithId<HomenoFieldBase>
export interface HomeNoFieldProps extends BaseFieldProps {
  schema: HomeNoFieldSchema
}

export const HomeNoField = ({
  schema,
  questionNumber,
}: HomeNoFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createHomeNoValidationRules(schema),
    [schema],
  )

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
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

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { get } from 'lodash'

import { FormColorTheme } from '~shared/types'
import { RatingShape } from '~shared/types/field'

import { createRatingValidationRules } from '~utils/fieldValidation'
import Rating from '~components/Field/Rating'
import { RatingProps } from '~components/Field/Rating/Rating'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { RatingFieldSchema, SingleAnswerFieldInput } from '../types'

export interface RatingFieldProps extends BaseFieldProps {
  schema: RatingFieldSchema
}

const transform = {
  toString: (value?: number) => {
    if (value === undefined) return
    return String(value)
  },
  toNumber: (value: string) => Number(value),
}

export const RatingField = ({
  schema,
  colorTheme = FormColorTheme.Blue,
}: RatingFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createRatingValidationRules(schema),
    [schema],
  )

  const ratingVariant: RatingProps['variant'] = useMemo(() => {
    switch (schema.ratingOptions.shape) {
      case RatingShape.Heart:
        return 'heart'
      case RatingShape.Star:
        return 'star'
    }
  }, [schema.ratingOptions.shape])

  const { control } = useFormContext<SingleAnswerFieldInput>()
  const { errors } = useFormState<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema}>
      <Controller
        rules={validationRules}
        control={control}
        name={schema._id}
        render={({ field: { value, onChange, ...rest } }) => (
          <Rating
            colorScheme={`theme-${colorTheme}`}
            numberOfRatings={schema.ratingOptions.steps}
            variant={ratingVariant}
            value={transform.toNumber(value)}
            isRequired={schema.required}
            isInvalid={!!get(errors, schema._id)}
            aria-label={`${schema.questionNumber}. ${schema.title}`}
            onChange={(val) => onChange(transform.toString(val))}
            {...rest}
          />
        )}
      />
    </FieldContainer>
  )
}

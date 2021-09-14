/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { Controller } from 'react-hook-form'

import {
  FormFieldWithId,
  RatingFieldBase,
  RatingShape,
} from '~shared/types/field'

import { createRatingValidationRules } from '~utils/fieldValidation'
import Rating from '~components/Field/Rating'
import { RatingProps } from '~components/Field/Rating/Rating'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

export type RatingFieldSchema = FormFieldWithId<RatingFieldBase>
export interface RatingFieldProps extends BaseFieldProps {
  schema: RatingFieldSchema
}

export const RatingField = ({
  schema,
  questionNumber,
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

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Controller
        rules={validationRules}
        name={schema._id}
        render={({ field }) => (
          <Rating
            numberOfRatings={schema.ratingOptions.steps}
            variant={ratingVariant}
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}

import { useMemo } from 'react'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { RatingFieldBase, RatingShape } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { CreatePageDrawerContentContainer } from '../../../../../common'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

type EditRatingProps = EditFieldProps<RatingFieldBase>

const EDIT_RATING_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'ratingOptions',
] as const

type EditRatingInputs = Pick<
  RatingFieldBase,
  (typeof EDIT_RATING_FIELD_KEYS)[number]
>

const EDIT_RATING_OPTIONS = {
  stepOptions: Array.from(Array(10), (_e, i) => String(i + 1)),
  shapeOptions: Object.keys(RatingShape),
}

export const EditRating = ({ field }: EditRatingProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    register,
    control,
    formState: { errors },
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditRatingInputs, RatingFieldBase>({
    field,
    transform: {
      input: (inputField) => pick(inputField, EDIT_RATING_FIELD_KEYS),
      output: (formOutput, originalField) =>
        extend({}, originalField, formOutput),
    },
  })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  return (
    <CreatePageDrawerContentContainer>
      <FormControl isRequired isReadOnly={isLoading} isInvalid={!!errors.title}>
        <FormLabel>Field Name</FormLabel>
        <Input autoFocus {...register('title', requiredValidationRule)} />
        <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading} isInvalid={!!errors.description}>
        <FormLabel>Description</FormLabel>
        <Textarea {...register('description')} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle
          {...register('required')}
          label={t(
            'features.adminForm.sidebar.fields.commonFieldComponents.required',
          )}
        />
      </FormControl>
      <FormControl id="ratingOptions.steps" isReadOnly={isLoading}>
        <FormLabel isRequired>
          {t('features.adminForm.sidebar.fields.rating.numOfSteps')}
        </FormLabel>
        <Controller
          control={control}
          name="ratingOptions.steps"
          render={({ field: { value, ...field } }) => (
            <SingleSelect
              isClearable={false}
              items={EDIT_RATING_OPTIONS.stepOptions}
              value={String(value)}
              {...field}
            />
          )}
        />
      </FormControl>
      <FormControl id="ratingOptions.shape" isReadOnly={isLoading}>
        <FormLabel isRequired>
          {t('features.adminForm.sidebar.fields.rating.shape')}
        </FormLabel>
        <Controller
          control={control}
          name="ratingOptions.shape"
          render={({ field }) => (
            <SingleSelect
              isClearable={false}
              items={EDIT_RATING_OPTIONS.shapeOptions}
              {...field}
            />
          )}
        />
      </FormControl>
      <FormFieldDrawerActions
        isLoading={isLoading}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </CreatePageDrawerContentContainer>
  )
}

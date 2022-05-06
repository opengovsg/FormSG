import { useMemo } from 'react'
import { Controller } from 'react-hook-form'
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

import { DrawerContentContainer } from '../common/DrawerContentContainer'
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
  typeof EDIT_RATING_FIELD_KEYS[number]
>

export const EditRating = ({ field }: EditRatingProps): JSX.Element => {
  const {
    register,
    control,
    formState: { errors },
    isSaveEnabled,
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
    <DrawerContentContainer>
      <FormControl isRequired isReadOnly={isLoading} isInvalid={!!errors.title}>
        <FormLabel>Question</FormLabel>
        <Input autoFocus {...register('title', requiredValidationRule)} />
        <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading} isInvalid={!!errors.description}>
        <FormLabel>Description</FormLabel>
        <Textarea {...register('description')} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle {...register('required')} label="Required" />
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <FormLabel isRequired>Number of steps</FormLabel>
        <Controller
          control={control}
          name="ratingOptions.steps"
          render={({ field: { value, ...field } }) => (
            <SingleSelect
              items={Array.from(Array(10), (e, i) => String(i + 1))}
              value={String(value)}
              {...field}
            />
          )}
        />
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <FormLabel isRequired>Shape</FormLabel>
        <Controller
          control={control}
          name="ratingOptions.shape"
          render={({ field }) => (
            <SingleSelect items={Object.keys(RatingShape)} {...field} />
          )}
        />
      </FormControl>
      <FormFieldDrawerActions
        isLoading={isLoading}
        isSaveEnabled={isSaveEnabled}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </DrawerContentContainer>
  )
}

import { useMemo } from 'react'
import { FormControl } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { RadioFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { CreatePageDrawerContentContainer } from '../../../../../common'
import {
  SPLIT_TEXTAREA_TRANSFORM,
  SPLIT_TEXTAREA_VALIDATION,
} from '../common/constants'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

type EditRadioProps = EditFieldProps<RadioFieldBase>

const EDIT_RADIO_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'othersRadioButton',
] as const

type EditRadioKeys = typeof EDIT_RADIO_FIELD_KEYS[number]

type EditRadioInputs = Pick<RadioFieldBase, EditRadioKeys> & {
  fieldOptionsString: string // Differs from fieldOptions in RadioFieldBase because input is a string. Will be converted to array using SPLIT_TEXTAREA_TRANSFORM
}

const transformRadioFieldToEditForm = (
  field: RadioFieldBase,
): EditRadioInputs => {
  return {
    ...pick(field, EDIT_RADIO_FIELD_KEYS),
    fieldOptionsString: SPLIT_TEXTAREA_TRANSFORM.input(field.fieldOptions),
  }
}

const transformRadioEditFormToField = (
  inputs: EditRadioInputs,
  originalField: RadioFieldBase,
): RadioFieldBase => {
  return extend({}, originalField, inputs, {
    fieldOptions: SPLIT_TEXTAREA_TRANSFORM.output(inputs.fieldOptionsString),
  })
}

export const EditRadio = ({ field }: EditRadioProps): JSX.Element => {
  const {
    register,
    formState: { errors },
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditRadioInputs, RadioFieldBase>({
    field,
    transform: {
      input: transformRadioFieldToEditForm,
      output: transformRadioEditFormToField,
    },
  })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  return (
    <CreatePageDrawerContentContainer>
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
        <Toggle {...register('othersRadioButton')} label="Others" />
      </FormControl>
      <FormControl
        isRequired
        isReadOnly={isLoading}
        isInvalid={!!errors.fieldOptionsString}
      >
        <FormLabel>Options</FormLabel>
        <Textarea
          placeholder="Enter one option per line"
          {...register('fieldOptionsString', {
            validate: SPLIT_TEXTAREA_VALIDATION,
          })}
        />
        <FormErrorMessage>
          {errors?.fieldOptionsString?.message}
        </FormErrorMessage>
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

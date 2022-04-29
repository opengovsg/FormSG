import { useMemo } from 'react'
import { FormControl } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { DropdownFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import {
  SPLIT_TEXTAREA_TRANSFORM,
  SPLIT_TEXTAREA_VALIDATION,
} from '../common/constants'
import { DrawerContentContainer } from '../common/DrawerContentContainer'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

type EditDropdownProps = EditFieldProps<DropdownFieldBase>

const EDIT_DROPDOWN_FIELD_KEYS = ['title', 'description', 'required'] as const

type EditDropdownKeys = typeof EDIT_DROPDOWN_FIELD_KEYS[number]

type EditDropdownInputs = Pick<DropdownFieldBase, EditDropdownKeys> & {
  fieldOptionsString: string // Differs from fieldOptions in DropdownFieldBase because input is a string. Will be converted to array using SPLIT_TEXTAREA_TRANSFORM
}

const transformDropdownFieldToEditForm = (
  field: DropdownFieldBase,
): EditDropdownInputs => {
  return {
    ...pick(field, EDIT_DROPDOWN_FIELD_KEYS),
    fieldOptionsString: SPLIT_TEXTAREA_TRANSFORM.input(field.fieldOptions),
  }
}

const transformDropdownEditFormToField = (
  inputs: EditDropdownInputs,
  originalField: DropdownFieldBase,
): DropdownFieldBase => {
  return extend({}, originalField, inputs, {
    fieldOptions: SPLIT_TEXTAREA_TRANSFORM.output(inputs.fieldOptionsString),
  })
}

export const EditDropdown = ({ field }: EditDropdownProps): JSX.Element => {
  const {
    register,
    formState: { errors },
    isSaveEnabled,
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditDropdownInputs, DropdownFieldBase>({
    field,
    transform: {
      input: transformDropdownFieldToEditForm,
      output: transformDropdownEditFormToField,
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
      <FormControl
        isRequired
        isReadOnly={isLoading}
        isInvalid={!!errors.fieldOptionsString}
      >
        <FormLabel>Options</FormLabel>
        <Textarea
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
        isSaveEnabled={isSaveEnabled}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </DrawerContentContainer>
  )
}

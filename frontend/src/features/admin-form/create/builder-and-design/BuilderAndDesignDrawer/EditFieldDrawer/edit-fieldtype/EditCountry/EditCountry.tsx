import { useMemo } from 'react'
import { FormControl } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { CountryFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { DrawerContentContainer } from '../common/DrawerContentContainer'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

type EditCountryProps = EditFieldProps<CountryFieldBase>

const EDIT_COUNTRY_FIELD_KEYS = ['title', 'description', 'required'] as const

type EditCountryKeys = typeof EDIT_COUNTRY_FIELD_KEYS[number]

type EditCountryInputs = Pick<CountryFieldBase, EditCountryKeys>

const transformCountryFieldToEditForm = (
  field: CountryFieldBase,
): EditCountryInputs => {
  return {
    ...pick(field, EDIT_COUNTRY_FIELD_KEYS),
  }
}

const transformCountryEditFormToField = (
  inputs: EditCountryInputs,
  originalField: CountryFieldBase,
): CountryFieldBase => {
  return extend({}, originalField, inputs, {})
}

export const EditCountry = ({ field }: EditCountryProps): JSX.Element => {
  const {
    register,
    formState: { errors },
    isSaveEnabled,
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditCountryInputs, CountryFieldBase>({
    field,
    transform: {
      input: transformCountryFieldToEditForm,
      output: transformCountryEditFormToField,
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

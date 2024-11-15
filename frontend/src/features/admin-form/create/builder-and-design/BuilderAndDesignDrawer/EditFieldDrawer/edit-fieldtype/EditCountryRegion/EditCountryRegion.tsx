import { useMemo } from 'react'
import { FormControl } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { CountryRegionFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { CreatePageDrawerContentContainer } from '~features/admin-form/create/common'

import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

type EditCountryRegionProps = EditFieldProps<CountryRegionFieldBase>

const EDIT_COUNTRY_FIELD_KEYS = ['title', 'description', 'required'] as const

type EditCountryRegionKeys = (typeof EDIT_COUNTRY_FIELD_KEYS)[number]

type EditCountryRegionInputs = Pick<
  CountryRegionFieldBase,
  EditCountryRegionKeys
>

const transformCountryRegionFieldToEditForm = (
  field: CountryRegionFieldBase,
): EditCountryRegionInputs => {
  return {
    ...pick(field, EDIT_COUNTRY_FIELD_KEYS),
  }
}

const transformCountryRegionEditFormToField = (
  inputs: EditCountryRegionInputs,
  originalField: CountryRegionFieldBase,
): CountryRegionFieldBase => {
  return extend({}, originalField, inputs, {})
}

export const EditCountryRegion = ({
  field,
}: EditCountryRegionProps): JSX.Element => {
  const {
    register,
    formState: { errors },
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditCountryRegionInputs, CountryRegionFieldBase>({
    field,
    transform: {
      input: transformCountryRegionFieldToEditForm,
      output: transformCountryRegionEditFormToField,
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
        <Toggle {...register('required')} label="Required" />
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

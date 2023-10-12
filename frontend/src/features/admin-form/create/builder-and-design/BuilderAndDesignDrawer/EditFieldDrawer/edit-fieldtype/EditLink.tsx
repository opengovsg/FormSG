import { useMemo } from 'react'
import { FormControl } from '@chakra-ui/react'
import { extend } from 'lodash'
import validator from 'validator'

import { LinkFieldBase, StatementFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'

import { CreatePageDrawerContentContainer } from '../../../../common'

import { FormFieldDrawerActions } from './common/FormFieldDrawerActions'
import { EditFieldProps } from './common/types'
import { useEditFieldForm } from './common/useEditFieldForm'

type EditLinkProps = EditFieldProps<LinkFieldBase>

type EditLinkInputs = Pick<LinkFieldBase, 'url' | 'description' | 'title'>

const linkValidation = (inputValue?: string) => {
  console.log({ inputValue })
  if (!inputValue) return true
  const trimmedInputValue = inputValue.trim()

  // Valid url check
  if (!validator.isURL(trimmedInputValue, { require_protocol: true }))
    return 'Please enter a valid url (http:// or https://)'

  // Passed all error validation.
  return true
}

export const EditLink = ({ field }: EditLinkProps): JSX.Element => {
  const {
    register,
    formState: { errors },
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditLinkInputs, LinkFieldBase>({
    field,
    transform: {
      input: (inputField) => ({
        url: inputField.url,
        description: inputField.description,
        title: inputField.title,
      }),
      output: (formOutput, originalField) =>
        extend({}, originalField, formOutput),
    },
  })

  const linkValidationRule = useMemo(
    () => ({
      validate: linkValidation,
    }),
    [],
  )

  return (
    <CreatePageDrawerContentContainer>
      <FormControl isRequired isReadOnly={isLoading} isInvalid={!!errors.url}>
        <FormLabel>Link</FormLabel>
        <Input autoFocus {...register('url', linkValidationRule)} />
        <FormErrorMessage>{errors?.url?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading} isInvalid={!!errors.title}>
        <FormLabel>Title</FormLabel>
        <Input {...register('title')} />
        <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading} isInvalid={!!errors.description}>
        <FormLabel>Link description</FormLabel>
        <Textarea {...register('description')} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
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

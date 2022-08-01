import { useMemo } from 'react'
import { FormControl } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { SectionFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'

import { DrawerContentContainer } from './common/DrawerContentContainer'
import { FormFieldDrawerActions } from './common/FormFieldDrawerActions'
import { EditFieldProps } from './common/types'
import { useEditFieldForm } from './common/useEditFieldForm'

type EditHeaderProps = EditFieldProps<SectionFieldBase>

type EditHeaderInputs = Pick<SectionFieldBase, 'title' | 'description'>

export const EditHeader = ({ field }: EditHeaderProps): JSX.Element => {
  const {
    register,
    formState: { errors },
    isSaveEnabled,
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditHeaderInputs, SectionFieldBase>({
    field,
    transform: {
      input: (inputField) => pick(inputField, ['title', 'description']),
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
      <FormControl isRequired isDisabled={isLoading} isInvalid={!!errors.title}>
        <FormLabel>Section header</FormLabel>
        <Input autoFocus {...register('title', requiredValidationRule)} />
        <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isDisabled={isLoading} isInvalid={!!errors.description}>
        <FormLabel>Description</FormLabel>
        <Textarea {...register('description')} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
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

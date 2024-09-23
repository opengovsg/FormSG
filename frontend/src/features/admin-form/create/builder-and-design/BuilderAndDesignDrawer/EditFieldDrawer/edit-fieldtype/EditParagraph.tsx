import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormControl } from '@chakra-ui/react'
import { extend } from 'lodash'

import { StatementFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Textarea from '~components/Textarea'

import { CreatePageDrawerContentContainer } from '../../../../common'

import { FormFieldDrawerActions } from './common/FormFieldDrawerActions'
import { EditFieldProps } from './common/types'
import { useEditFieldForm } from './common/useEditFieldForm'

type EditParagraphProps = EditFieldProps<StatementFieldBase>

type EditParagraphInputs = Pick<StatementFieldBase, 'description'>

export const EditParagraph = ({ field }: EditParagraphProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditParagraphInputs, StatementFieldBase>({
    field,
    transform: {
      input: (inputField) => ({
        title: 'Statement',
        description: inputField.description,
      }),
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
      <FormControl
        isRequired
        isReadOnly={isLoading}
        isInvalid={!!errors.description}
      >
        <FormLabel>
          {t('features.adminForm.sidebar.fields.paragraph')}
        </FormLabel>
        <Textarea
          autoFocus
          {...register('description', requiredValidationRule)}
        />
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

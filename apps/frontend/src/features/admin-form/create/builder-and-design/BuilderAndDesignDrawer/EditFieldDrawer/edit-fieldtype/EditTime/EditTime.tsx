import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormControl } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { TimeFieldBase } from 'formsg-shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { CreatePageDrawerContentContainer } from '../../../../../common'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

type EditTimeProps = EditFieldProps<TimeFieldBase>

const EDIT_TIME_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'use24HourFormat',
  'includeSeconds',
] as const

type EditTimeInputs = Pick<TimeFieldBase, (typeof EDIT_TIME_FIELD_KEYS)[number]>

export const EditTime = ({ field }: EditTimeProps): JSX.Element => {
  const {
    register,
    formState: { errors },
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditTimeInputs, TimeFieldBase>({
    field,
    transform: {
      input: (inputField) => pick(inputField, EDIT_TIME_FIELD_KEYS),
      output: (formOutput, originalField) =>
        extend({}, originalField, formOutput),
    },
  })

  const { t } = useTranslation()

  const requiredValidationRule = useMemo(
    () =>
      createBaseValidationRules<EditTimeInputs, 'title'>({
        required: true,
      }),
    [],
  )

  return (
    <CreatePageDrawerContentContainer>
      <FormControl isRequired isReadOnly={isLoading} isInvalid={!!errors.title}>
        <FormLabel>
          {t('features.adminForm.sidebar.fields.commonFieldComponents.title')}
        </FormLabel>
        <Input autoFocus {...register('title', requiredValidationRule)} />
        <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading} isInvalid={!!errors.description}>
        <FormLabel>
          {t(
            'features.adminForm.sidebar.fields.commonFieldComponents.description',
          )}
        </FormLabel>
        <Textarea {...register('description')} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle {...register('required')} label="Required" />
      </FormControl>
      {/*
        Both toggles change the input the respondent sees and nothing else.
        Answers are always stored as 24-hour HH:MM:SS, so flipping either is
        safe on a form that has already collected responses — no existing
        answer is invalidated and an export column keeps its shape.
      */}
      <FormControl isReadOnly={isLoading}>
        <Toggle
          {...register('use24HourFormat')}
          label={t('features.adminForm.sidebar.fields.time.use24HourFormat')}
          description={t(
            'features.adminForm.sidebar.fields.time.use24HourFormatDescription',
          )}
        />
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle
          {...register('includeSeconds')}
          label={t('features.adminForm.sidebar.fields.time.includeSeconds')}
          description={t(
            'features.adminForm.sidebar.fields.time.includeSecondsDescription',
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

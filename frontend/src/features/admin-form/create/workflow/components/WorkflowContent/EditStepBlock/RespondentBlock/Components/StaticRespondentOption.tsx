import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Text } from '@chakra-ui/react'
import { get } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { WorkflowType } from '~shared/types'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'
import { TagInput } from '~components/TagInput'

import { useWorkflowTypeValidation } from './hooks'
import { RespondentOptionProps } from './types'

export const StaticRespondentOption = ({
  isLoading,
  formMethods,
  selectedWorkflowType,
}: RespondentOptionProps) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.workflow.staticRespondent',
  })
  const {
    register,
    control,
    formState: { errors },
  } = formMethods
  const staticTagInputErrorMessage = get(errors, 'emails.message')

  const workflowTypeValidation = useWorkflowTypeValidation()
  return (
    <>
      <Radio
        isDisabled={isLoading}
        isLabelFullWidth
        allowDeselect={false}
        value={WorkflowType.Static}
        {...register('workflow_type', workflowTypeValidation)}
        px="0.5rem"
        __css={{
          _focusWithin: {
            boxShadow: 'none',
          },
        }}
      >
        <Text>{t('title')}</Text>
        {selectedWorkflowType === WorkflowType.Static ? (
          <FormControl
            pt="0.5rem"
            isReadOnly={isLoading}
            id="emails"
            isRequired
            isInvalid={staticTagInputErrorMessage}
            key="emails"
          >
            <Controller
              name="emails"
              control={control}
              rules={{
                validate: {
                  required: (emails) =>
                    !emails || emails.length === 0
                      ? t('validation.required')
                      : true,
                  isEmails: (emails) =>
                    !emails ||
                    emails.every((email) => isEmail(email)) ||
                    t('validation.invalidEmails'),
                },
              }}
              render={({ field }) => (
                <TagInput
                  isDisabled={isLoading}
                  placeholder={t('placeholder')}
                  tagValidation={isEmail}
                  {...field}
                />
              )}
            />
            <FormErrorMessage>{staticTagInputErrorMessage}</FormErrorMessage>
            {!staticTagInputErrorMessage ? (
              <Text textStyle="body-2" color="secondary.400" mt="0.5rem">
                {t('helperText')}
              </Text>
            ) : null}
          </FormControl>
        ) : null}
      </Radio>
    </>
  )
}

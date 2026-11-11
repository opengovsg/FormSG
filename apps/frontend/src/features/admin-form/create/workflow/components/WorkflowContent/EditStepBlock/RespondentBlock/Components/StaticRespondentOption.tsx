import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Text } from '@chakra-ui/react'
import { get } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { WorkflowType } from 'formsg-shared/types'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'
import { TagInput } from '~components/TagInput'

import { useIsWorkflowSavePermissive } from '../../../../../hooks/useIsWorkflowSavePermissive'

import { useWorkflowTypeValidation } from './hooks'
import { NESTED_CONTROL_PR } from './layout'
import { RespondentOptionProps } from './types'

export const StaticRespondentOption = ({
  isLoading,
  formMethods,
  selectedWorkflowType,
}: RespondentOptionProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = formMethods
  const staticTagInputErrorMessage = get(errors, 'emails.message')

  const { t } = useTranslation()
  const workflowTypeValidation = useWorkflowTypeValidation()
  const isSavePermissive = useIsWorkflowSavePermissive()
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
        <Text>{'Specific emails'}</Text>
        {selectedWorkflowType === WorkflowType.Static ? (
          <FormControl
            pt="0.5rem"
            pr={NESTED_CONTROL_PR}
            isReadOnly={isLoading}
            id="emails"
            isRequired={!isSavePermissive}
            isInvalid={!!staticTagInputErrorMessage}
            key="emails"
          >
            <Controller
              name="emails"
              control={control}
              rules={{
                validate: {
                  required: (emails) => {
                    if (isSavePermissive) return true
                    return !emails || emails.length === 0
                      ? 'You must enter at least one email to receive responses'
                      : true
                  },
                  isEmails: (emails) =>
                    !emails ||
                    emails.every((email) => isEmail(email)) ||
                    t(
                      'features.adminForm.sidebar.workflow.staticRespondent.invalidEmails',
                    ),
                },
              }}
              render={({ field }) => (
                <TagInput
                  isDisabled={isLoading}
                  placeholder="me@example.com"
                  tagValidation={isEmail}
                  {...field}
                />
              )}
            />
            <FormErrorMessage>{staticTagInputErrorMessage}</FormErrorMessage>
            {!staticTagInputErrorMessage ? (
              <Text textStyle="body-2" color="secondary.400" mt="0.5rem">
                Separate multiple emails with a comma
              </Text>
            ) : null}
          </FormControl>
        ) : null}
      </Radio>
    </>
  )
}

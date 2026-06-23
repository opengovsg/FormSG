import { Controller } from 'react-hook-form'
import { FormControl, Text } from '@chakra-ui/react'
import { get } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { WorkflowType } from 'formsg-shared/types'

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
        <Text>You choose who fills in this step</Text>
        {selectedWorkflowType === WorkflowType.Static ? (
          <Text textStyle="body-2" color="secondary.400" pt="0.25rem">
            Enter any email address
          </Text>
        ) : null}
        {selectedWorkflowType === WorkflowType.Static ? (
          <FormControl
            pt="0.5rem"
            isReadOnly={isLoading}
            id="emails"
            isRequired
            isInvalid={!!staticTagInputErrorMessage}
            key="emails"
          >
            <Controller
              name="emails"
              control={control}
              rules={{
                validate: {
                  isEmails: (emails) =>
                    !emails ||
                    emails.length === 0 ||
                    emails.every((email) => isEmail(email)) ||
                    "Enter valid emails separated by commas, like me@example.com. Invalid emails won't be saved.",
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

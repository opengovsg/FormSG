import { useCallback } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { As, FormControl, Stack, Text } from '@chakra-ui/react'
import { get } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { WorkflowType } from '~shared/types'

import { textStyles } from '~theme/textStyles'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Radio from '~components/Radio'
import { TagInput } from '~components/TagInput'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'
import { useUser } from '~features/user/queries'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { EditStepBlockContainer } from './EditStepBlockContainer'

const WORKFLOW_TYPE_VALIDATION = {
  required: 'Please select a respondent type',
  validate: (value: WorkflowType) => {
    if (![WorkflowType.Static, WorkflowType.Dynamic].includes(value)) {
      return 'The selected respondent type is invalid'
    }
  },
}

interface RespondentOptionProps {
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
  selectedWorkflowType: WorkflowType
}

const StaticRespondentOption = ({
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

  return (
    <>
      <Radio
        isDisabled={isLoading}
        isLabelFullWidth
        allowDeselect={false}
        value={WorkflowType.Static}
        {...register('workflow_type', WORKFLOW_TYPE_VALIDATION)}
        px="8px"
        __css={{
          _focusWithin: {
            boxShadow: 'none',
          },
        }}
      >
        <Text>Fixed email(s)</Text>
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
                      ? 'You must enter at least one email to receive responses'
                      : true,
                  isEmails: (emails) =>
                    !emails ||
                    emails.every((email) => isEmail(email)) ||
                    'Please enter valid email(s) (e.g. me@example.com) separated by commas, as invalid emails will not be saved',
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
              <Text textStyle="body-2" mt="0.5rem">
                Separate multiple emails with a comma
              </Text>
            ) : null}
          </FormControl>
        ) : null}
      </Radio>
    </>
  )
}

interface DynamicRespondentOptionProps extends RespondentOptionProps {
  emailFieldItems: {
    label: string
    value: string
    icon?: As
  }[]
}

const DynamicRespondentOption = ({
  isLoading,
  selectedWorkflowType,
  formMethods,
  emailFieldItems,
}: DynamicRespondentOptionProps) => {
  const {
    register,
    formState: { errors },
    control,
  } = formMethods

  return (
    <>
      <Radio
        isDisabled={isLoading}
        isLabelFullWidth
        allowDeselect={false}
        value={WorkflowType.Dynamic}
        {...register('workflow_type', WORKFLOW_TYPE_VALIDATION)}
        px="8px"
        __css={{
          _focusWithin: {
            boxShadow: 'none',
          },
        }}
      >
        <Text>An email field from the form</Text>
        {selectedWorkflowType === WorkflowType.Dynamic ? (
          <FormControl
            pt="0.5rem"
            isReadOnly={isLoading}
            id="field"
            isRequired
            isInvalid={!!errors.field}
          >
            <Controller
              control={control}
              name="field"
              rules={{
                required: 'Please select a field',
                validate: (selectedValue) =>
                  !emailFieldItems ||
                  emailFieldItems.some(
                    ({ value: fieldValue }) => fieldValue === selectedValue,
                  ) ||
                  'Field is not an email field',
              }}
              render={({ field: { value = '', ...rest } }) => (
                <SingleSelect
                  isDisabled={isLoading}
                  isClearable={false}
                  placeholder="Select a field"
                  items={emailFieldItems}
                  value={value}
                  {...rest}
                />
              )}
            />
            <FormErrorMessage>{errors.field?.message}</FormErrorMessage>
          </FormControl>
        ) : null}
      </Radio>
    </>
  )
}

interface RespondentBlockProps {
  stepNumber: number
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
}

export const RespondentBlock = ({
  stepNumber,
  isLoading,
  formMethods,
}: RespondentBlockProps): JSX.Element => {
  const {
    formState: { errors },
    watch,
    setValue,
    control,
  } = formMethods

  // TODO: (MRF-email-notif) Remove isTest check when MRF email notifications is out of beta
  const isTest = process.env.NODE_ENV === 'test'
  const { user, isLoading: isUserLoading } = useUser()
  isLoading = isLoading || isUserLoading

  const { emailFormFields = [] } = useAdminFormWorkflow()

  const emailFieldItems = emailFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )
  const emailFieldIds = emailFormFields.map(({ _id }) => _id)

  const getValueIfNotDeleted = useCallback(
    // Why: When the Yes/No field has been deleted, the approval_field is still set to the
    // invalid form field id but cannot be seen or cleared in the SingleSelect component
    // since no matching Yes/No item can be found.
    // Hence, we clear the approval_field to allow the user to re-select a new valid value.
    (value) => {
      if (value !== '' && !emailFieldIds.includes(value)) {
        setValue('field', '')
        return ''
      }
      return value
    },
    [setValue, emailFieldIds],
  )

  const selectedWorkflowType = watch('workflow_type')

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  return (
    <EditStepBlockContainer>
      {isFirstStep ? (
        <>
          {/* TODO: (MRF-email-notif) Remove isTest check when MRF email
          notifications is out of beta */}
          {isTest || user?.betaFlags?.mrfEmailNotifications ? (
            <FormControl isInvalid={!!errors.field}>
              <FormLabel style={textStyles.h4}>
                Select email field for notifications to be sent to this
                respondent
              </FormLabel>
              <Controller
                name="field"
                rules={{
                  validate: (selectedValue) => {
                    return (
                      !selectedValue ||
                      !emailFieldItems ||
                      emailFieldItems.some(
                        ({ value: fieldValue }) => fieldValue === selectedValue,
                      ) ||
                      'Field is not an email field'
                    )
                  },
                }}
                control={control}
                render={({ field: { value = '', ...rest } }) => (
                  <SingleSelect
                    placeholder="Select an email field from your form"
                    items={emailFieldItems}
                    value={getValueIfNotDeleted(value)}
                    isClearable
                    {...rest}
                  />
                )}
              />
              <FormErrorMessage>{errors.field?.message}</FormErrorMessage>
            </FormControl>
          ) : (
            <Text>Anyone you share the form link with</Text>
          )}
        </>
      ) : (
        <>
          <FormControl
            isReadOnly={isLoading}
            id="workflowType"
            isRequired
            isInvalid={!!errors.workflow_type}
          >
            <FormLabel style={textStyles.h4}>Select a respondent</FormLabel>
            <Stack spacing="0.25rem">
              <Radio.RadioGroup value={selectedWorkflowType}>
                <DynamicRespondentOption
                  selectedWorkflowType={selectedWorkflowType}
                  emailFieldItems={emailFieldItems}
                  formMethods={formMethods}
                  isLoading={isLoading}
                />
                <StaticRespondentOption
                  selectedWorkflowType={selectedWorkflowType}
                  formMethods={formMethods}
                  isLoading={isLoading}
                />
              </Radio.RadioGroup>
            </Stack>
            <FormErrorMessage>{errors.workflow_type?.message}</FormErrorMessage>
          </FormControl>
        </>
      )}
    </EditStepBlockContainer>
  )
}

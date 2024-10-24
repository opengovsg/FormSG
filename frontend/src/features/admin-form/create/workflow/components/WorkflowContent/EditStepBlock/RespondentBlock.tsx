import { useCallback } from 'react'
import { Controller, useForm, UseFormReturn } from 'react-hook-form'
import { BiPlus } from 'react-icons/bi'
import {
  As,
  Button,
  FormControl,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { get } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { UserDto, WorkflowType } from '~shared/types'

import { textStyles } from '~theme/textStyles'
import { SingleSelect } from '~components/Dropdown'
import Attachment from '~components/Field/Attachment'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Radio from '~components/Radio'
import { TagInput } from '~components/TagInput'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { ConditionalRoutingOptionModal } from './ConditionalRoutingOptionModal'
import { EditStepBlockContainer } from './EditStepBlockContainer'

const WORKFLOW_TYPE_VALIDATION = {
  required: 'Please select a respondent type',
  validate: (value: WorkflowType) => {
    if (!Object.values(WorkflowType).includes(value)) {
      return 'The selected respondent type is invalid'
    }
  },
}

interface RespondentOptionProps {
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
  selectedWorkflowType: WorkflowType
}

export interface FieldItem {
  label: string
  value: string
  icon?: As
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
        px="0.5rem"
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

interface DynamicRespondentOptionProps extends RespondentOptionProps {
  emailFieldItems: FieldItem[]
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
        px="0.5rem"
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
                validate: (selectedValue) => {
                  return (
                    isLoading ||
                    !emailFieldItems ||
                    emailFieldItems.some(
                      ({ value: fieldValue }) => fieldValue === selectedValue,
                    ) ||
                    'Field is not an email field'
                  )
                },
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

interface ConditionalRoutingOptionProps extends RespondentOptionProps {
  conditionalFieldItems: FieldItem[]
}

export interface ConditionalRoutingConfig {
  conditionalFieldId: string
  csvFile: File
}

const ConditionalRoutingOption = ({
  isLoading,
  formMethods,
  selectedWorkflowType,
  conditionalFieldItems,
}: ConditionalRoutingOptionProps) => {
  const { register } = formMethods

  const {
    control: conditionalRoutingConfigControl,
    watch: watchConditionalRoutingConfig,
  } = useForm<ConditionalRoutingConfig>()

  const isConditionalRoutingFieldSelected =
    watchConditionalRoutingConfig('csvFile') &&
    watchConditionalRoutingConfig('conditionalFieldId')

  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <ConditionalRoutingOptionModal
        conditionalFieldItems={conditionalFieldItems}
        isLoading={isLoading}
        isOpen={isOpen}
        onClose={onClose}
        control={conditionalRoutingConfigControl}
      />
      <Radio
        isDisabled={isLoading}
        isLabelFullWidth
        allowDeselect={false}
        value={WorkflowType.Conditional}
        {...register('workflow_type', WORKFLOW_TYPE_VALIDATION)}
        px="0.5rem"
        __css={{
          _focusWithin: {
            boxShadow: 'none',
          },
        }}
      >
        <Text mb="0.5rem">
          Email(s) assigned to options in a dropdown or radio field
        </Text>
        {selectedWorkflowType === WorkflowType.Conditional ? (
          <>
            {isConditionalRoutingFieldSelected ? (
              <Controller
                name="csvFile"
                control={conditionalRoutingConfigControl}
                render={({ field: { onChange, name, value } }) => (
                  <Attachment
                    name={name}
                    onChange={onChange}
                    value={value}
                    showDownload
                  />
                )}
              />
            ) : (
              <Button
                w="100%"
                variant="outline"
                leftIcon={<BiPlus fontSize="1.5rem" />}
                onClick={onOpen}
              >
                Select a field and add email(s) to options
              </Button>
            )}
          </>
        ) : null}
      </Radio>
    </>
  )
}

interface RespondentBlockProps {
  stepNumber: number
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
  user: UserDto | undefined
}

export const RespondentBlock = ({
  stepNumber,
  isLoading,
  formMethods,
  user,
}: RespondentBlockProps): JSX.Element => {
  const {
    formState: { errors },
    watch,
    setValue,
    control,
  } = formMethods

  // TODO: (MRF-email-notif) Remove isTest check when MRF email notifications is out of beta
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'

  const {
    emailFormFields = [],
    radioFormFields = [],
    dropdownFormFields = [],
  } = useAdminFormWorkflow()

  const emailFieldItems = emailFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )
  const emailFieldIds = emailFormFields.map(({ _id }) => _id)

  const conditionalFieldItems = [...radioFormFields, ...dropdownFormFields].map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )

  const getValueIfNotDeleted = useCallback(
    // Why: When the Yes/No field has been deleted, the approval_field is still set to the
    // invalid form field id but cannot be seen or cleared in the SingleSelect component
    // since no matching Yes/No item can be found.
    // Hence, we clear the approval_field to allow the user to re-select a new valid value.
    (value: string) => {
      if (!isLoading && value && !emailFieldIds.includes(value)) {
        setValue('field', '')
        return ''
      }
      return value
    },
    [isLoading, setValue, emailFieldIds],
  )

  const selectedWorkflowType = watch('workflow_type')

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  return (
    <EditStepBlockContainer>
      {isFirstStep ? (
        <>
          {/* TODO: (MRF-email-notif) Remove isTest and betaFlag check when MRF email
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
                    isDisabled={isLoading}
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
        <FormControl
          isReadOnly={isLoading}
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
              <ConditionalRoutingOption
                selectedWorkflowType={selectedWorkflowType}
                conditionalFieldItems={conditionalFieldItems}
                formMethods={formMethods}
                isLoading={isLoading}
              />
            </Radio.RadioGroup>
          </Stack>
          <FormErrorMessage>{errors.workflow_type?.message}</FormErrorMessage>
        </FormControl>
      )}
    </EditStepBlockContainer>
  )
}

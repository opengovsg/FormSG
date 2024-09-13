import { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Box,
  FormControl,
  FormErrorMessage,
  Skeleton,
  Text,
} from '@chakra-ui/react'
import { get, isEmpty, isEqual, uniq } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { MultirespondentFormSettings } from '~shared/types/form'

import { OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES } from '~utils/formValidation'
import { MultiSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { useAdminFormWorkflow } from '~features/admin-form/create/workflow/hooks/useAdminFormWorkflow'

import { useMutateFormSettings } from '../mutations'

interface MrfEmailNotificationsFormProps {
  settings: MultirespondentFormSettings
  isDisabled: boolean
}

const WORKFLOW_EMAIL_MULTISELECT_NAME = 'email-multi-select'
const OTHER_PARTIES_EMAIL_INPUT_NAME = 'other-parties-email-input'

interface FormData {
  [WORKFLOW_EMAIL_MULTISELECT_NAME]: string[]
  [OTHER_PARTIES_EMAIL_INPUT_NAME]: string[]
}

const MrfEmailNotificationsForm = ({
  settings,
  isDisabled,
}: MrfEmailNotificationsFormProps) => {
  const { isLoading, formWorkflow } = useAdminFormWorkflow()

  const formWorkflowStepsWithStepNumber =
    formWorkflow?.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
    })) ?? []

  const filterInvalidEmails = useCallback((emails: string[]) => {
    if (!emails) return []
    return emails.filter((email) => isEmail(email))
  }, [])

  const { stepsToNotify, emails } = settings

  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<{
    [WORKFLOW_EMAIL_MULTISELECT_NAME]: string[]
    [OTHER_PARTIES_EMAIL_INPUT_NAME]: string[]
  }>({
    defaultValues: {
      [WORKFLOW_EMAIL_MULTISELECT_NAME]: stepsToNotify,
      [OTHER_PARTIES_EMAIL_INPUT_NAME]: emails,
    },
  })

  const { mutateMrfEmailNotifications } = useMutateFormSettings()

  const handleSubmitEmailNotificationSettings = ({
    nextStaticEmails,
    nextStepsToNotify,
  }: {
    nextStaticEmails: string[]
    nextStepsToNotify: string[]
  }) => {
    if (
      isEqual(nextStaticEmails, emails) &&
      isEqual(nextStepsToNotify, stepsToNotify)
    ) {
      return
    }
    return mutateMrfEmailNotifications.mutate({
      emails: nextStaticEmails,
      stepsToNotify: nextStepsToNotify,
    })
  }

  const onSubmit = (formData: FormData) => {
    const selectedSteps = formData[WORKFLOW_EMAIL_MULTISELECT_NAME]
    const selectedEmails = formData[OTHER_PARTIES_EMAIL_INPUT_NAME]

    return handleSubmitEmailNotificationSettings({
      nextStepsToNotify: selectedSteps,
      nextStaticEmails: selectedEmails,
    })
  }

  const handleOtherPartiesEmailInputBlur = () => {
    const uniqueValidEmails = uniq(
      filterInvalidEmails(getValues(OTHER_PARTIES_EMAIL_INPUT_NAME)),
    )
    setValue(OTHER_PARTIES_EMAIL_INPUT_NAME, uniqueValidEmails)
    handleSubmit(onSubmit)()
  }

  const otherPartiesEmailInputPlaceholder =
    getValues(OTHER_PARTIES_EMAIL_INPUT_NAME)?.length > 0
      ? undefined
      : 'me@example.com'

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box>
        <Text textStyle="h3" textColor="secondary.500" mb="0.25rem">
          Workflow Outcome Notifications
        </Text>
        <Text textStyle="body-1" textColor="secondary.700" mb="2.5rem">
          Send an email to inform selected respondents when the form and/or
          workflow is complete.
        </Text>
        <FormLabel textColor="secondary.700">
          Notify respondents in your workflow
        </FormLabel>
        <Skeleton isLoaded={!isLoading}>
          <Box my="0.75rem">
            <Controller
              control={control}
              name={WORKFLOW_EMAIL_MULTISELECT_NAME}
              render={({
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                field: { value: values = [], onChange, onBlur, ...rest },
              }) => (
                <MultiSelect
                  items={formWorkflowStepsWithStepNumber.map((step) => ({
                    label: `Respondent(s) in Step ${step.stepNumber}`,
                    value: step._id,
                  }))}
                  values={values}
                  onChange={onChange}
                  onBlur={handleSubmit(onSubmit)}
                  placeholder="Select respondents from your form"
                  isSelectedItemFullWidth
                  isDisabled={isLoading || isDisabled}
                  {...rest}
                />
              )}
            />
          </Box>
        </Skeleton>
      </Box>
      <Box my="2rem">
        <FormControl
          isInvalid={!isEmpty(errors[OTHER_PARTIES_EMAIL_INPUT_NAME])}
          isDisabled={isDisabled}
        >
          <FormLabel
            textColor="secondary.700"
            tooltipVariant="info"
            tooltipPlacement="top"
            tooltipText="Include the admin's email to inform them whenever a workflow is completed"
          >
            Notify other parties
          </FormLabel>
          <Controller
            name={OTHER_PARTIES_EMAIL_INPUT_NAME}
            control={control}
            rules={OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES}
            render={({ field }) => (
              <TagInput
                placeholder={otherPartiesEmailInputPlaceholder}
                {...field}
                isDisabled={isDisabled}
                onBlur={handleOtherPartiesEmailInputBlur}
                tagValidation={isEmail}
              />
            )}
          />
          {isEmpty(errors[OTHER_PARTIES_EMAIL_INPUT_NAME]) ? (
            <FormLabel.Description color="secondary.400" mt="0.5rem">
              Separate multiple email addresses with a comma
            </FormLabel.Description>
          ) : (
            <FormErrorMessage>
              {get(errors, `${OTHER_PARTIES_EMAIL_INPUT_NAME}.message`)}
            </FormErrorMessage>
          )}
        </FormControl>
      </Box>
    </form>
  )
}

interface MrfFormEmailSectionProps {
  settings: MultirespondentFormSettings
  isDisabled: boolean
}

export const MrfFormEmailSection = ({
  settings,
  isDisabled,
}: MrfFormEmailSectionProps): JSX.Element => {
  return (
    <Box opacity={isDisabled ? 0.3 : 1}>
      <MrfEmailNotificationsForm settings={settings} isDisabled={isDisabled} />
    </Box>
  )
}

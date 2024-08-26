import { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Box, FormControl, FormErrorMessage, Skeleton } from '@chakra-ui/react'
import { debounce, get, isEmpty, isEqual, uniq } from 'lodash'
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

const WorkflowEmailMultiSelectName = 'email-multi-select'
const OtherPartiesEmailInputName = 'other-parties-email-input'

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

  const checkIsEmail = useMemo(() => isEmail, [])

  const filterInvalidEmails = useCallback(
    (emails: string[]) => {
      if (!emails) return []
      return emails.filter((email) => checkIsEmail(email))
    },
    [checkIsEmail],
  )

  const { stepsToNotify, emails } = settings

  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<{
    [WorkflowEmailMultiSelectName]: string[]
    [OtherPartiesEmailInputName]: string[]
  }>({
    defaultValues: {
      [WorkflowEmailMultiSelectName]: stepsToNotify,
      [OtherPartiesEmailInputName]: emails,
    },
  })

  const { mutateMrfEmailNotifications } = useMutateFormSettings()

  const handleSubmitEmailNotificationSettings = useCallback(
    ({ nextStaticEmails, nextStepsToNotify }) => {
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
    },
    [mutateMrfEmailNotifications, emails, stepsToNotify],
  )
  const DEBOUNCE_DELAY_IN_MS = 800
  const onSubmit = useCallback(
    (formData) => {
      const selectedSteps = formData[WorkflowEmailMultiSelectName]
      const selectedEmails = formData[OtherPartiesEmailInputName]

      return handleSubmitEmailNotificationSettings({
        nextStepsToNotify: selectedSteps,
        nextStaticEmails: selectedEmails,
      })
    },
    [handleSubmitEmailNotificationSettings],
  )
  const onSubmitDebounced = useCallback(
    (formData) => debounce(() => onSubmit(formData), DEBOUNCE_DELAY_IN_MS)(),
    [onSubmit],
  )

  const handleWorkflowEmailMultiSelectChange = useCallback(() => {
    handleSubmit(onSubmitDebounced)()
  }, [handleSubmit, onSubmitDebounced])

  const handleOtherPartiesEmailInputBlur = useCallback(() => {
    const uniqueValidEmails = uniq(
      filterInvalidEmails(getValues(OtherPartiesEmailInputName)),
    )
    setValue(OtherPartiesEmailInputName, uniqueValidEmails)
    handleSubmit(onSubmit)()
  }, [getValues, handleSubmit, onSubmit, setValue, filterInvalidEmails])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box>
        <FormLabel>Notify respondents in your workflow</FormLabel>
        <Skeleton isLoaded={!isLoading}>
          <Box my="0.75rem">
            <Controller
              control={control}
              name={WorkflowEmailMultiSelectName}
              render={({
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                field: { value: values = [], onChange, ...rest },
              }) => (
                <MultiSelect
                  items={formWorkflowStepsWithStepNumber.map((step) => ({
                    label: `Respondent(s) in Step ${step.stepNumber}`,
                    value: step._id,
                  }))}
                  values={values}
                  onChange={(values) => {
                    onChange(values)
                    handleWorkflowEmailMultiSelectChange()
                  }}
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
          isInvalid={!isEmpty(errors[OtherPartiesEmailInputName])}
          isDisabled={isDisabled}
        >
          <FormLabel
            tooltipVariant="info"
            tooltipPlacement="top"
            tooltipText="Include the admin's email to inform them whenever a workflow is completed"
          >
            Notify other parties
          </FormLabel>
          <Controller
            name={OtherPartiesEmailInputName}
            control={control}
            rules={OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES}
            render={({ field }) => (
              <TagInput
                {...(getValues(OtherPartiesEmailInputName)?.length > 0
                  ? {}
                  : {
                      placeholder: 'me@example.com',
                    })}
                {...field}
                isDisabled={isDisabled}
                onBlur={handleOtherPartiesEmailInputBlur}
                tagValidation={checkIsEmail}
              />
            )}
          />
          {isEmpty(errors[OtherPartiesEmailInputName]) ? (
            <FormLabel.Description color="secondary.400" mt="0.5rem">
              Separate multiple email addresses with a comma
            </FormLabel.Description>
          ) : (
            <FormErrorMessage>
              {get(errors, `${OtherPartiesEmailInputName}.message`)}
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

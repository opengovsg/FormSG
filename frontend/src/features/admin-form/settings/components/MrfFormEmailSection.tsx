import { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Box, FormControl, FormErrorMessage, Skeleton } from '@chakra-ui/react'
import { debounce, get, isEmpty, uniq } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { FormFieldDto } from '~shared/types'
import {
  FormWorkflowStepDynamic,
  FormWorkflowStepStatic,
  WorkflowType,
} from '~shared/types/form'

import { OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES } from '~utils/formValidation'
import { MultiSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { useAdminFormWorkflow } from '~features/admin-form/create/workflow/hooks/useAdminFormWorkflow'

import { useMutateFormSettings } from '../mutations'

interface MrfEmailNotificationsFormProps {
  isDisabled: boolean
}

interface WorkflowEmailMultiSelectValue {
  type: 'email' | 'form_field'
  value: string | FormFieldDto['_id']
}

const WorkflowEmailMultiSelectName = 'email-multi-select'
const OtherPartiesEmailInputName = 'other-parties-email-input'

const MrfEmailNotificationsForm = ({
  isDisabled,
}: MrfEmailNotificationsFormProps) => {
  const { isLoading, formWorkflow, idToFieldMap } = useAdminFormWorkflow()

  const formWorkflowStepsWithStepNumber = formWorkflow?.map((step, index) => ({
    ...step,
    stepNumber: index + 1,
  }))

  const workflowRespondentStaticEmailItems =
    formWorkflowStepsWithStepNumber
      ?.filter((step) => step.workflow_type === WorkflowType.Static)
      .flatMap((step) => {
        const { emails } = step as FormWorkflowStepStatic
        return emails.map((email) => ({ stepNumber: step.stepNumber, email }))
      })
      .map(({ email, stepNumber }) => ({
        label: email,
        value: JSON.stringify({ type: 'email', value: email }),
        description: `Respondent in Step ${stepNumber}`,
      })) ?? []

  const workflowRespondentDynamicEmailFieldItems =
    formWorkflowStepsWithStepNumber
      ?.filter((step) => step.workflow_type === WorkflowType.Dynamic)
      .map((step) => ({
        stepNumber: step.stepNumber,
        ...idToFieldMap[(step as FormWorkflowStepDynamic).field],
      }))
      .map(({ _id, questionNumber, title, fieldType, stepNumber }) => ({
        label: `${questionNumber}. ${title}`,
        value: JSON.stringify({ type: 'form_field', value: _id }),
        description: `Respondent in Step ${stepNumber}`,
        icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
      })) ?? []

  const workflowRespondentSelectItems = [
    ...workflowRespondentStaticEmailItems,
    ...workflowRespondentDynamicEmailFieldItems,
  ]

  const checkIsEmail = useMemo(() => isEmail, [])

  const filterInvalidEmails = useCallback(
    (emails: string[]) => {
      if (!emails) return []
      return emails.filter((email) => checkIsEmail(email))
    },
    [checkIsEmail],
  )

  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<{
    [WorkflowEmailMultiSelectName]: WorkflowEmailMultiSelectValue[]
    [OtherPartiesEmailInputName]: string[]
  }>({
    defaultValues: {
      [WorkflowEmailMultiSelectName]: [],
      [OtherPartiesEmailInputName]: [],
    },
  })

  const { mutateMrfEmailNotifications } = useMutateFormSettings()

  const handleSubmitEmailNotificationSettings = useCallback(
    (nextStaticEmails, nextEmailFields) => {
      // TODO: (Kevin Foong) handle if the settings are unchanged, dont send
      return mutateMrfEmailNotifications.mutate({
        notification_emails: nextStaticEmails,
        notification_email_fields: nextEmailFields,
      })
    },
    [mutateMrfEmailNotifications],
  )
  const DEBOUNCE_DELAY_IN_MS = 1500
  const onSubmit = useCallback(
    (formData) => {
      const workflowEmailMultiSelectValues: WorkflowEmailMultiSelectValue[] =
        formData[WorkflowEmailMultiSelectName]
      const otherPartiesEmails = formData[OtherPartiesEmailInputName]

      const nextStaticEmailsFromMultiSelect = workflowEmailMultiSelectValues
        .filter((val) => val.type === 'email')
        .map((val) => val.value)
      const nextStaticEmails = uniq(
        nextStaticEmailsFromMultiSelect.concat(otherPartiesEmails),
      )

      const nextEmailFields = uniq(
        workflowEmailMultiSelectValues
          .filter((val) => val.type === 'form_field')
          .map((val) => val.value),
      )

      return handleSubmitEmailNotificationSettings(
        nextStaticEmails,
        nextEmailFields,
      )
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
    // Get rid of bad emails before submitting.
    setValue(
      OtherPartiesEmailInputName,
      filterInvalidEmails(getValues(OtherPartiesEmailInputName)),
    )
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
                field: { value: values, onChange, ...rest },
              }) => (
                <MultiSelect
                  items={workflowRespondentSelectItems}
                  values={values.map((val) => JSON.stringify(val))}
                  onChange={(values) => {
                    onChange(
                      values.map((valString: string) => JSON.parse(valString)),
                    )
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
  isDisabled: boolean
}

export const MrfFormEmailSection = ({
  isDisabled,
}: MrfFormEmailSectionProps): JSX.Element => {
  return (
    <Box opacity={isDisabled ? 0.3 : 1}>
      <MrfEmailNotificationsForm isDisabled={isDisabled} />
    </Box>
  )
}

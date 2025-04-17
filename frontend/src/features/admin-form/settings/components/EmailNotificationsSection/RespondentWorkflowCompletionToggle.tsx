import { useCallback, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, FormLabel, Skeleton, Text } from '@chakra-ui/react'
import { isEqual } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { MultirespondentFormSettings } from '~shared/types'

import { MultiSelect, SingleSelect } from '~components/Dropdown'
import Toggle from '~components/Toggle'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { useAdminFormWorkflow } from '~features/admin-form/create/workflow/hooks/useAdminFormWorkflow'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

interface respondentWorkflowCompletionInputProps {
  settings: MultirespondentFormSettings
  isDisabled: boolean
}

const STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME =
  'step-1-notify-single-select'
const WORKFLOW_EMAIL_MULTISELECT_NAME = 'email-multi-select'

interface FormData {
  [WORKFLOW_EMAIL_MULTISELECT_NAME]: string[]
  [STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]: string
}

const RespondentWorkflowCompletionInput = ({
  settings,
  isDisabled,
}: respondentWorkflowCompletionInputProps) => {
  const { t } = useTranslation()
  const {
    isLoading,
    formWorkflow,
    emailFormFields = [],
  } = useAdminFormWorkflow()

  const formWorkflowStepsWithStepNumber =
    formWorkflow?.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
    })) ?? []

  const emailFieldItems = emailFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )

  const filterInvalidEmails = useCallback((emails: string[]) => {
    if (!emails) return []
    return emails.filter((email) => isEmail(email))
  }, [])

  const { stepsToNotify, emails, stepOneEmailNotificationFieldId } = settings

  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<{
    [STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]: string
    [WORKFLOW_EMAIL_MULTISELECT_NAME]: string[]
  }>({
    defaultValues: {
      [WORKFLOW_EMAIL_MULTISELECT_NAME]: stepsToNotify,
      [STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]:
        stepOneEmailNotificationFieldId,
    },
  })

  const { mutateMrfEmailNotifications } = useMutateFormSettings()

  const handleSubmitEmailNotificationSettings = ({
    nextStepsToNotify,
    nextStepOneEmailNotificationFieldId,
  }: {
    nextStepsToNotify: string[]
    nextStepOneEmailNotificationFieldId: string
  }) => {
    if (
      isEqual(nextStepsToNotify, stepsToNotify) &&
      nextStepOneEmailNotificationFieldId === stepOneEmailNotificationFieldId
    ) {
      return
    }
    return mutateMrfEmailNotifications.mutate({
      emails: [], //TODO: remove this
      stepsToNotify: nextStepsToNotify,
      stepOneEmailNotificationFieldId: nextStepOneEmailNotificationFieldId,
    })
  }

  const onSubmit = (formData: FormData) => {
    const selectedSteps = formData[WORKFLOW_EMAIL_MULTISELECT_NAME]
    const selectedStepOneEmailNotificationFieldId =
      formData[STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]

    return handleSubmitEmailNotificationSettings({
      nextStepsToNotify: selectedSteps,
      nextStepOneEmailNotificationFieldId:
        selectedStepOneEmailNotificationFieldId,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box mt={'1.5rem'}>
        <Box>
          <FormLabel mb="0.75rem" textColor="secondary.700">
            {t(
              'features.adminForm.settings.emailNotifications.section.mrf.respondents.step1.label',
            )}
          </FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <Controller
              control={control}
              name={STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME}
              render={({
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                field: { value, onBlur, ...rest },
              }) => (
                <SingleSelect
                  isDisabled={isLoading || isDisabled}
                  placeholder={t(
                    'features.adminForm.settings.emailNotifications.section.mrf.respondents.step1.placeholder',
                  )}
                  items={emailFieldItems}
                  onBlur={handleSubmit(onSubmit)}
                  isClearable
                  value={value}
                  {...rest}
                />
              )}
            />
          </Skeleton>
        </Box>
        <Box mt="1.5rem">
          <FormLabel mb="0.75rem" textColor="secondary.700">
            {t(
              'features.adminForm.settings.emailNotifications.section.mrf.respondents.stepN.label.overall',
            )}
          </FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <Controller
              control={control}
              name={WORKFLOW_EMAIL_MULTISELECT_NAME}
              render={({
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                field: { value: values = [], onChange, onBlur, ...rest },
              }) => (
                <MultiSelect
                  items={formWorkflowStepsWithStepNumber
                    .filter((step) => step.stepNumber > 1)
                    .map(({ stepNumber, _id: value }) => ({
                      label: t(
                        'features.adminForm.settings.emailNotifications.section.mrf.respondents.stepN.label.each',
                        { stepNumber },
                      ),
                      value,
                    }))}
                  values={values}
                  onChange={onChange}
                  onBlur={handleSubmit(onSubmit)}
                  placeholder={t(
                    'features.adminForm.settings.emailNotifications.section.mrf.respondents.stepN.placeholder',
                  )}
                  isSelectedItemFullWidth
                  isDisabled={isLoading || isDisabled}
                  {...rest}
                />
              )}
            />
          </Skeleton>
        </Box>
      </Box>
    </form>
  )
}

export const RespondentWorkflowCompletionToggle = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const hasRespondentWorkflowCompletion = useMemo(
    // () => settings?.hasRespondentWorkflowCompletion, //TODO: replace this
    () => settings?.hasRespondentCopy,
    [settings],
  )

  const { mutateFormRespondentWorkflowCompletion } = useMutateFormSettings()

  const [showInputs, setShowInputs] = useState<boolean>(
    settings ? settings.hasRespondentCopy : false, //TODO: replace this
  )

  const handleToggleRespondentWorkflowCompletion = useCallback(() => {
    if (
      !settings ||
      isLoadingSettings ||
      mutateFormRespondentWorkflowCompletion.isLoading
    )
      return
    const nextHasToggleRespondentWorkflowCompletion =
      // !settings.hasToggleRespondentWorkflowCompletion
      !settings.hasRespondentCopy //TODO: replace this

    setShowInputs(nextHasToggleRespondentWorkflowCompletion)
    return mutateFormRespondentWorkflowCompletion.mutate(
      nextHasToggleRespondentWorkflowCompletion,
    )
  }, [isLoadingSettings, mutateFormRespondentWorkflowCompletion, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Toggle
        isLoading={mutateFormRespondentWorkflowCompletion.isLoading}
        isChecked={hasRespondentWorkflowCompletion}
        label={t(
          'features.adminForm.settings.emailNotifications.section.mrf.respondents.workflowCompletionLabel',
        )}
        onChange={() => handleToggleRespondentWorkflowCompletion()}
      />
      {showInputs && (
        <RespondentWorkflowCompletionInput
          settings={settings}
          isDisabled={false}
        />
      )}
    </Skeleton>
  )
}

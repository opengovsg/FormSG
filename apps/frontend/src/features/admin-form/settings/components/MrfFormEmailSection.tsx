import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, Text } from '@chakra-ui/react'
import { isEqual, uniq } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { MultirespondentFormSettings } from 'formsg-shared/types/form'

import { useAdminFormWorkflow } from '~features/admin-form/create/workflow/hooks/useAdminFormWorkflow'
import { useUser } from '~features/user/queries'

import { useMutateFormSettings } from '../mutations'

import { RespondentCopyToggle } from './EmailNotificationsSection/RespondentCopyToggle'
import {
  MrfEmailRecipientsFieldGroup,
  MrfEmailRecipientsFormData,
  OTHER_PARTIES_EMAIL_INPUT_NAME,
  STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME,
  WORKFLOW_EMAIL_MULTISELECT_NAME,
} from './MrfEmailRecipientsFieldGroup'

interface MrfEmailNotificationsFormProps {
  settings: MultirespondentFormSettings
  isDisabled: boolean
  isHighContrast: boolean
}

const MrfEmailNotificationsForm = ({
  settings,
  isDisabled,
  isHighContrast,
}: MrfEmailNotificationsFormProps) => {
  const { t } = useTranslation()
  const { formWorkflow } = useAdminFormWorkflow()

  //TODO: (Respondent Copy): Remove isTest and user when respondent copy is out of beta
  const { user } = useUser()
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'

  const workflowStepCount = formWorkflow?.length ?? 0

  const filterInvalidEmails = useCallback((emails: string[]) => {
    if (!emails) return []
    return emails.filter((email) => isEmail(email))
  }, [])

  const { stepsToNotify, emails, stepOneEmailNotificationFieldId } = settings

  const { handleSubmit, control, setValue, getValues } =
    useForm<MrfEmailRecipientsFormData>({
      defaultValues: {
        [WORKFLOW_EMAIL_MULTISELECT_NAME]: stepsToNotify,
        [OTHER_PARTIES_EMAIL_INPUT_NAME]: emails,
        [STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]:
          stepOneEmailNotificationFieldId,
      },
    })

  const { mutateMrfEmailNotifications } = useMutateFormSettings()

  const handleSubmitEmailNotificationSettings = ({
    nextStaticEmails,
    nextStepsToNotify,
    nextStepOneEmailNotificationFieldId,
  }: {
    nextStaticEmails: string[]
    nextStepsToNotify: string[]
    nextStepOneEmailNotificationFieldId: string
  }) => {
    if (
      isEqual(nextStaticEmails, emails) &&
      isEqual(nextStepsToNotify, stepsToNotify) &&
      nextStepOneEmailNotificationFieldId === stepOneEmailNotificationFieldId
    ) {
      return
    }
    return mutateMrfEmailNotifications.mutate({
      emails: nextStaticEmails,
      stepsToNotify: nextStepsToNotify,
      stepOneEmailNotificationFieldId: nextStepOneEmailNotificationFieldId,
    })
  }

  const onSubmit = (formData: MrfEmailRecipientsFormData) => {
    const selectedSteps = formData[WORKFLOW_EMAIL_MULTISELECT_NAME]
    const selectedEmails = formData[OTHER_PARTIES_EMAIL_INPUT_NAME]
    const selectedStepOneEmailNotificationFieldId =
      formData[STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]

    return handleSubmitEmailNotificationSettings({
      nextStepsToNotify: selectedSteps,
      nextStaticEmails: selectedEmails,
      nextStepOneEmailNotificationFieldId:
        selectedStepOneEmailNotificationFieldId,
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

  const sectionText: string =
    workflowStepCount >= 1
      ? t(
          'features.adminForm.settings.emailNotifications.section.mrf.selectRecipientWorkflow',
        )
      : t(
          'features.adminForm.settings.emailNotifications.section.mrf.selectRecipientNoWorkflow',
        )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <MrfEmailRecipientsFieldGroup
        control={control}
        isDisabled={isDisabled}
        isHighContrast={isHighContrast}
        heading={
          <Text textStyle="body-1" textColor="secondary.700" mb="1.5rem">
            {sectionText}
          </Text>
        }
        otherPartiesPlaceholder={otherPartiesEmailInputPlaceholder}
        onOtherPartiesBlur={handleOtherPartiesEmailInputBlur}
        onSelectBlur={handleSubmit(onSubmit)}
      />
    </form>
  )
}

interface MrfFormEmailSectionProps {
  settings: MultirespondentFormSettings
  isDisabled: boolean
  isHighContrast?: boolean
}

export const MrfFormEmailSection = ({
  settings,
  isDisabled,
  isHighContrast = true,
}: MrfFormEmailSectionProps): JSX.Element => {
  return (
    <Box opacity={1}>
      <MrfEmailNotificationsForm
        settings={settings}
        isDisabled={isDisabled}
        isHighContrast={isHighContrast}
      />
    </Box>
  )
}

import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, Text } from '@chakra-ui/react'
import { uniq } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { MultirespondentFormSettings } from 'formsg-shared/types/form'

import {
  MrfEmailRecipientsFieldGroup,
  MrfEmailRecipientsFormData,
  OTHER_PARTIES_EMAIL_INPUT_NAME,
  STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME,
  WORKFLOW_EMAIL_MULTISELECT_NAME,
} from '~features/admin-form/settings/components/MrfEmailRecipientsFieldGroup'
import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import {
  DecryptedResponseLike,
  getStopNotifiedEmails,
  WorkflowHistory,
} from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { WorkflowActionModal } from './WorkflowActionModal'

const I18N_PREFIX = `${WORKFLOW_ACTIONS_I18N}.stopModal` as const

export interface StopWorkflowModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (notifiedEmails: string[]) => void
  isLoading?: boolean
  history: WorkflowHistory
  responses?: DecryptedResponseLike[]
}

export const StopWorkflowModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  history,
  responses,
}: StopWorkflowModalProps): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings } = useAdminFormSettings<MultirespondentFormSettings>()

  const { control, reset, getValues, setValue } =
    useForm<MrfEmailRecipientsFormData>()

  useEffect(() => {
    if (!isOpen) return
    reset({
      [WORKFLOW_EMAIL_MULTISELECT_NAME]: settings?.stepsToNotify ?? [],
      [OTHER_PARTIES_EMAIL_INPUT_NAME]: settings?.emails ?? [],
      [STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]:
        settings?.stepOneEmailNotificationFieldId ?? '',
    })
  }, [isOpen, reset, settings])

  const [stepIdsToNotify, otherEmails, stepOneEmailFieldId] = useWatch({
    control,
    name: [
      WORKFLOW_EMAIL_MULTISELECT_NAME,
      OTHER_PARTIES_EMAIL_INPUT_NAME,
      STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME,
    ],
  })

  const notifiedEmails = useMemo(
    () =>
      getStopNotifiedEmails({
        history,
        responses,
        otherEmails: (otherEmails ?? []).filter((email) => isEmail(email)),
        stepOneEmailFieldId,
        stepIdsToNotify: stepIdsToNotify ?? [],
      }),
    [history, responses, otherEmails, stepOneEmailFieldId, stepIdsToNotify],
  )

  return (
    <WorkflowActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t(`${I18N_PREFIX}.title`)}
      description={t(`${I18N_PREFIX}.description`)}
      isBeta
      notifiedEmails={notifiedEmails}
      confirmLabel={t(`${I18N_PREFIX}.confirm`)}
      confirmColorScheme="danger"
      isConfirmLoading={isLoading}
      onConfirm={() => onConfirm(notifiedEmails)}
    >
      <Box mt="-1.5rem">
        <MrfEmailRecipientsFieldGroup
          heading={
            <Text textStyle="body-1" textColor="secondary.700" mb="1.5rem">
              {t(`${I18N_PREFIX}.notifyHeading`)}
            </Text>
          }
          control={control}
          isDisabled={false}
          isHighContrast
          otherPartiesPlaceholder="me@example.com"
          onOtherPartiesBlur={() =>
            setValue(
              OTHER_PARTIES_EMAIL_INPUT_NAME,
              uniq(
                (getValues(OTHER_PARTIES_EMAIL_INPUT_NAME) ?? []).filter(
                  (email) => isEmail(email),
                ),
              ),
            )
          }
          hideOtherPartiesTooltip
        />
      </Box>
    </WorkflowActionModal>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiBell, BiCheck } from 'react-icons/bi'
import { useQueryClient } from 'react-query'
import { useDisclosure } from '@chakra-ui/react'

import Button from '~components/Button'

import { useFormRemindersMutations } from '~features/admin-form/common/mutations'

import { adminFormResponsesKeys } from '../queries'

import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { WorkflowActionModal } from './WorkflowActionModal'

const I18N_PREFIX = `${WORKFLOW_ACTIONS_I18N}.reminderModal` as const

export interface RemindButtonProps {
  formId: string
  submissionId: string
  submissionSecretKey?: string
  stepToken?: string
  enabled?: boolean
  targetStep?: number
  recipients: string[]
}

export const useWorkflowReminder = ({
  formId,
  submissionId,
  submissionSecretKey,
  stepToken,
  recipients,
  enabled = true,
  targetStep,
}: RemindButtonProps) => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { sendReminderForResponseMutation } = useFormRemindersMutations()
  const [isSent, setIsSent] = useState(false)
  const queryClient = useQueryClient()
  const generation = useRef(0)
  useEffect(() => {
    generation.current += 1
    setIsSent(false)
    onClose()
  }, [enabled, formId, submissionId, stepToken, targetStep, onClose])

  const handleConfirm = () => {
    if (!submissionSecretKey || !enabled) return
    const requestGeneration = generation.current
    sendReminderForResponseMutation.mutate(
      { formId, submissionId, submissionSecretKey, stepToken },
      {
        onSuccess: () => {
          if (requestGeneration === generation.current) {
            setIsSent(true)
            onClose()
          }
          void queryClient.invalidateQueries(
            adminFormResponsesKeys.individual(formId, submissionId),
          )
        },
      },
    )
  }

  return {
    isSent,
    onOpen,
    isLoading: sendReminderForResponseMutation.isLoading,
    modal: (
      <WorkflowActionModal
        isOpen={enabled && isOpen}
        onClose={onClose}
        title={t(`${I18N_PREFIX}.title`)}
        description={t(`${I18N_PREFIX}.description`)}
        notifiedEmails={recipients}
        confirmLabel={t(`${I18N_PREFIX}.confirm`)}
        isConfirmLoading={sendReminderForResponseMutation.isLoading}
        onConfirm={handleConfirm}
      />
    ),
  }
}

export const RemindButton = (props: RemindButtonProps): JSX.Element => {
  const { t } = useTranslation()
  const reminder = useWorkflowReminder(props)
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        colorScheme="secondary"
        leftIcon={
          reminder.isSent ? (
            <BiCheck fontSize="1.25rem" />
          ) : (
            <BiBell fontSize="1.25rem" />
          )
        }
        isDisabled={reminder.isSent || !props.submissionSecretKey}
        onClick={reminder.onOpen}
      >
        {reminder.isSent
          ? t(
              'features.adminForm.responses.responsesPage.storage.unlockedResponses.responsesTable.sendReminderButton.reminderSent',
            )
          : t(`${WORKFLOW_ACTIONS_I18N}.remindButton`)}
      </Button>
      {reminder.modal}
    </>
  )
}

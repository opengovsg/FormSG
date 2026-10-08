import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiBell, BiCheck } from 'react-icons/bi'
import { useDisclosure } from '@chakra-ui/react'

import Button from '~components/Button'

import { useFormRemindersMutations } from '~features/admin-form/common/mutations'

import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { WorkflowActionModal } from './WorkflowActionModal'

const I18N_PREFIX = `${WORKFLOW_ACTIONS_I18N}.reminderModal` as const

interface RemindButtonProps {
  formId: string
  submissionId: string
  submissionSecretKey?: string
  stepToken?: string
  recipients: string[]
}

export const RemindButton = ({
  formId,
  submissionId,
  submissionSecretKey,
  stepToken,
  recipients,
}: RemindButtonProps): JSX.Element => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { sendReminderForResponseMutation } = useFormRemindersMutations()
  const [isSent, setIsSent] = useState(false)

  const handleConfirm = () => {
    if (!submissionSecretKey) return
    sendReminderForResponseMutation.mutate(
      { formId, submissionId, submissionSecretKey, stepToken },
      {
        onSuccess: () => {
          setIsSent(true)
          onClose()
        },
      },
    )
  }

  return (
    <>
      <Button
        variant="outline"
        colorScheme="secondary"
        leftIcon={
          isSent ? (
            <BiCheck fontSize="1.25rem" />
          ) : (
            <BiBell fontSize="1.25rem" />
          )
        }
        isDisabled={isSent || !submissionSecretKey}
        onClick={onOpen}
      >
        {isSent
          ? t(
              'features.adminForm.responses.responsesPage.storage.unlockedResponses.responsesTable.sendReminderButton.reminderSent',
            )
          : t(`${WORKFLOW_ACTIONS_I18N}.remindButton`)}
      </Button>
      <WorkflowActionModal
        isOpen={isOpen}
        onClose={onClose}
        title={t(`${I18N_PREFIX}.title`)}
        description={t(`${I18N_PREFIX}.description`)}
        notifiedEmails={recipients}
        confirmLabel={t(`${I18N_PREFIX}.confirm`)}
        isConfirmLoading={sendReminderForResponseMutation.isLoading}
        onConfirm={handleConfirm}
      />
    </>
  )
}

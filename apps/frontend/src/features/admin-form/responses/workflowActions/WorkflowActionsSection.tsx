import { useTranslation } from 'react-i18next'
import { BiStopCircle } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import { Flex, useDisclosure } from '@chakra-ui/react'

import { SubmissionMrfMetadata, WorkflowStatus } from 'formsg-shared/types'

import Button from '~components/Button'

import { useAdminFormCollaborators } from '~features/admin-form/common/queries'

import { DecryptedResponseLike, WorkflowHistory } from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { useStopWorkflowMutation } from './mutations'
import { StopWorkflowModal } from './StopWorkflowModal'
import { useWorkflowActionsGate } from './useWorkflowActionsGate'

interface WorkflowActionsSectionProps {
  submissionId: string
  mrf: SubmissionMrfMetadata
  history?: WorkflowHistory
  responses?: DecryptedResponseLike[]
  isLoading: boolean
}

export const WorkflowActionsSection = ({
  submissionId,
  mrf,
  history = { submittedSteps: [], workflow: [] },
  responses,
  isLoading,
}: WorkflowActionsSectionProps): JSX.Element | null => {
  const { t } = useTranslation()
  const { formId = '' } = useParams()
  const isWorkflowActionsOn = useWorkflowActionsGate(mrf)
  const { hasEditAccess } = useAdminFormCollaborators(formId)
  const stopModal = useDisclosure()
  const stopMutation = useStopWorkflowMutation(formId)

  if (
    !isWorkflowActionsOn ||
    !hasEditAccess ||
    mrf?.stoppedAt ||
    mrf?.workflowStatus !== WorkflowStatus.PENDING
  ) {
    return null
  }

  const handleStop = (emails: string[]) =>
    stopMutation.mutate(
      { submissionId, emails },
      { onSettled: stopModal.onClose },
    )

  return (
    <>
      <Flex gap="0.5rem" wrap="wrap" pt="0.25rem">
        <Button
          variant="outline"
          colorScheme="secondary"
          _hover={{
            bg: 'danger.100',
            color: 'danger.500',
            borderColor: 'danger.500',
          }}
          _active={{
            bg: 'danger.200',
            color: 'danger.500',
            borderColor: 'danger.500',
          }}
          leftIcon={<BiStopCircle fontSize="1.25rem" />}
          isDisabled={isLoading}
          onClick={stopModal.onOpen}
        >
          {t(`${WORKFLOW_ACTIONS_I18N}.stopButton`)}
        </Button>
      </Flex>
      <StopWorkflowModal
        isOpen={stopModal.isOpen}
        onClose={stopModal.onClose}
        onConfirm={handleStop}
        isLoading={stopMutation.isLoading}
        history={history}
        responses={responses}
      />
    </>
  )
}

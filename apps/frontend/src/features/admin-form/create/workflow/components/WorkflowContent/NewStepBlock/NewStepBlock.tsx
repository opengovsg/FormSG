import { useCallback } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BiPlus } from 'react-icons/bi'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { Stack, Text, useDisclosure } from '@chakra-ui/react'

import { FormWorkflowStep } from 'formsg-shared/types'

import { workflowNs } from '~/i18n/locales/features/admin-form/sidebar/workflow'

import { ADMINFORM_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'
import Tooltip from '~components/Tooltip'

import {
  cancelPendingSwitchSelector,
  completeSaveSelector,
  createOrEditDataSelector,
  isCreatingStateSelector,
  requestSwitchToCreatingSelector,
  setCompletedStepSelector,
  setToCreatingSelector,
  stepDraftSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useIsWorkflowEditBlocked } from '../../../hooks/useIsWorkflowEditBlocked'
import { useWorkflowMutations } from '../../../mutations'
import { AdminEditWorkflowState } from '../../../types'
import { CloseFormToEditModal } from '../../CloseFormToEditModal'
import { EditStepBlock } from '../EditStepBlock'

const WebhookBlockedStep = () => {
  const { t } = useTranslation(workflowNs)
  const { formId } = useParams()

  return (
    <Stack spacing="1.5rem">
      <InlineMessage variant="info">
        <Text>
          <Trans
            t={t}
            i18nKey="webhookEnabledNoMoreSteps"
            components={{
              webhookSettingsLink: (
                <Link
                  as={RouterLink}
                  to={`${ADMINFORM_ROUTE}/${formId}/settings/webhooks`}
                />
              ),
            }}
          />
        </Text>
      </InlineMessage>
      <Button variant="outline" leftIcon={<BiPlus />} isDisabled>
        {t('approvals.addStep')}
      </Button>
    </Stack>
  )
}

export const NewStepBlock = () => {
  const { t } = useTranslation(workflowNs)
  const { formWorkflow, isPaymentEnabled, isGenericWebhookEnabled } =
    useAdminFormWorkflow()
  const { createStepMutation } = useWorkflowMutations()
  const {
    isCreatingState,
    stateData,
    setToCreating,
    requestSwitchToCreating,
    completeSave,
    cancelPendingSwitch,
    setCompletedStep,
  } = useAdminWorkflowStore((state) => ({
    isCreatingState: isCreatingStateSelector(state),
    stateData: createOrEditDataSelector(state),
    setToCreating: setToCreatingSelector(state),
    requestSwitchToCreating: requestSwitchToCreatingSelector(state),
    completeSave: completeSaveSelector(state),
    cancelPendingSwitch: cancelPendingSwitchSelector(state),
    setCompletedStep: setCompletedStepSelector(state),
  }))

  const stepDraft = useAdminWorkflowStore(stepDraftSelector)
  const draftInputs =
    stepDraft?.target.state === AdminEditWorkflowState.CreatingStep
      ? stepDraft.inputs
      : undefined

  const isEditBlocked = useIsWorkflowEditBlocked()
  const {
    isOpen: isBlockedModalOpen,
    onClose: onBlockedModalClose,
    onOpen: onBlockedModalOpen,
  } = useDisclosure()

  const newStepNumber = formWorkflow?.length ?? 0

  const isWebhookBlocked = isGenericWebhookEnabled && newStepNumber >= 1

  const handleAddStep = () => {
    if (isEditBlocked) {
      onBlockedModalOpen()
      return
    }
    if (stateData) {
      requestSwitchToCreating()
      return
    }
    setToCreating()
  }

  const handleSubmit = useCallback(
    (step: FormWorkflowStep) =>
      createStepMutation.mutate(step, {
        onSuccess: () => {
          setCompletedStep(newStepNumber)
          completeSave()
        },
        onError: cancelPendingSwitch,
      }),
    [
      createStepMutation,
      completeSave,
      cancelPendingSwitch,
      setCompletedStep,
      newStepNumber,
    ],
  )

  if (!formWorkflow) return null

  if (isWebhookBlocked) return <WebhookBlockedStep />

  return isCreatingState ? (
    <EditStepBlock
      stepNumber={formWorkflow.length}
      isLoading={createStepMutation.isLoading}
      onSubmit={handleSubmit}
      defaultValues={draftInputs ?? { edit: [] }}
      submitButtonLabel={t('approvals.addStep')}
    />
  ) : (
    <>
      <CloseFormToEditModal
        isOpen={isBlockedModalOpen}
        onClose={onBlockedModalClose}
      />
      <Tooltip
        label={isPaymentEnabled ? t('paymentEnabledNoSteps') : undefined}
        shouldWrapChildren={isPaymentEnabled}
      >
        <Button
          onClick={handleAddStep}
          variant="outline"
          leftIcon={<BiPlus />}
          isDisabled={isPaymentEnabled}
        >
          {t('approvals.addStep')}
        </Button>
      </Tooltip>
    </>
  )
}

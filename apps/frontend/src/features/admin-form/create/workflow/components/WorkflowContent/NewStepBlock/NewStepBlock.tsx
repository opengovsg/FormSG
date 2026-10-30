import { useCallback, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BiPlus } from 'react-icons/bi'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { Stack, Text, useDisclosure } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormWorkflowStepWriteDto } from 'formsg-shared/types'

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
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useIsWorkflowEditBlocked } from '../../../hooks/useIsWorkflowEditBlocked'
import { useWorkflowMutations } from '../../../mutations'
import { CloseFormToEditModal } from '../../CloseFormToEditModal'
import { EditStepBlock } from '../EditStepBlock'

const WebhookBlockedStep = () => {
  const v4Enabled = useFeatureIsOn(featureFlags.mrfWebhooksV4)
  const { t } = useTranslation()
  const { formId } = useParams()

  return (
    <Stack spacing="1.5rem">
      <InlineMessage variant="info">
        <Text>
          <Trans
            i18nKey={
              v4Enabled
                ? 'features.adminForm.sidebar.workflow.legacyWebhookEnabledNoMoreSteps'
                : 'features.adminForm.sidebar.workflow.webhookEnabledNoMoreSteps'
            }
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
        {t('features.adminForm.sidebar.workflow.approvals.addStep')}
      </Button>
    </Stack>
  )
}

export const NewStepBlock = () => {
  const { t } = useTranslation()
  const { formWorkflow, isPaymentEnabled, isLegacyWebhookEnabled } =
    useAdminFormWorkflow()
  const { createStepMutation, updateStepMutation } = useWorkflowMutations()
  const creationStepNumber = useRef<number>()
  const createdStep = useRef<{ stepNumber: number; id: string }>()
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

  const isEditBlocked = useIsWorkflowEditBlocked()
  const {
    isOpen: isBlockedModalOpen,
    onClose: onBlockedModalClose,
    onOpen: onBlockedModalOpen,
  } = useDisclosure()

  // A restriction request can fail after the step itself was created. Keep
  // this editor on that step and update it on retry rather than adding another.
  if (!isCreatingState) {
    creationStepNumber.current = undefined
    createdStep.current = undefined
  } else if (creationStepNumber.current === undefined) {
    creationStepNumber.current = formWorkflow?.length ?? 0
  }
  const newStepNumber = creationStepNumber.current ?? formWorkflow?.length ?? 0

  const isWebhookBlocked = isLegacyWebhookEnabled && newStepNumber >= 1

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
    async (step: FormWorkflowStepWriteDto, afterSave?: () => Promise<void>) => {
      try {
        if (createdStep.current) {
          await updateStepMutation.mutateAsync({
            stepNumber: createdStep.current.stepNumber,
            updateStepBody: { ...step, _id: createdStep.current.id },
          })
        } else {
          const workflow = await createStepMutation.mutateAsync(step)
          const savedStep = workflow[newStepNumber]
          createdStep.current = { stepNumber: newStepNumber, id: savedStep._id }
        }
        await afterSave?.()
        setCompletedStep(newStepNumber)
        completeSave()
      } catch (error) {
        cancelPendingSwitch()
        throw error
      }
    },
    [
      createStepMutation,
      updateStepMutation,
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
      stepNumber={newStepNumber}
      isLoading={createStepMutation.isLoading || updateStepMutation.isLoading}
      onSubmit={handleSubmit}
      defaultValues={{ edit: [] }}
      submitButtonLabel={t(
        'features.adminForm.sidebar.workflow.approvals.addStep',
      )}
    />
  ) : (
    <>
      <CloseFormToEditModal
        isOpen={isBlockedModalOpen}
        onClose={onBlockedModalClose}
      />
      <Tooltip
        label={
          isPaymentEnabled
            ? t('features.adminForm.sidebar.workflow.paymentEnabledNoSteps')
            : undefined
        }
        shouldWrapChildren={isPaymentEnabled}
      >
        <Button
          onClick={handleAddStep}
          variant="outline"
          leftIcon={<BiPlus />}
          isDisabled={isPaymentEnabled}
          data-testid="workflow-add-step"
        >
          {t('features.adminForm.sidebar.workflow.approvals.addStep')}
        </Button>
      </Tooltip>
    </>
  )
}

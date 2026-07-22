import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BiPlus } from 'react-icons/bi'

import { FormWorkflowStep } from 'formsg-shared/types'

import Button from '~components/Button'

import {
  cancelPendingSwitchSelector,
  completeSaveSelector,
  isCreatingStateSelector,
  setToCreatingSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useWorkflowMutations } from '../../../mutations'
import { EditStepBlock } from '../EditStepBlock'

export const NewStepBlock = () => {
  const { t } = useTranslation()
  const { formWorkflow } = useAdminFormWorkflow()
  const { createStepMutation } = useWorkflowMutations()
  const { isCreatingState, setToCreating, completeSave, cancelPendingSwitch } =
    useAdminWorkflowStore((state) => ({
      isCreatingState: isCreatingStateSelector(state),
      setToCreating: setToCreatingSelector(state),
      completeSave: completeSaveSelector(state),
      cancelPendingSwitch: cancelPendingSwitchSelector(state),
    }))
  const handleSubmit = useCallback(
    (step: FormWorkflowStep) =>
      createStepMutation.mutate(step, {
        onSuccess: completeSave,
        // Keep the card open and drop any pending switch so a failed
        // auto-save cannot redirect a later successful save.
        onError: cancelPendingSwitch,
      }),
    [createStepMutation, completeSave, cancelPendingSwitch],
  )

  if (!formWorkflow) return null

  return isCreatingState ? (
    <EditStepBlock
      stepNumber={formWorkflow.length}
      isLoading={createStepMutation.isLoading}
      onSubmit={handleSubmit}
      defaultValues={{ edit: [] }}
      submitButtonLabel={t(
        'features.adminForm.sidebar.workflow.approvals.addStep',
      )}
    />
  ) : (
    <Button onClick={setToCreating} variant="outline" leftIcon={<BiPlus />}>
      {t('features.adminForm.sidebar.workflow.approvals.addStep')}
    </Button>
  )
}

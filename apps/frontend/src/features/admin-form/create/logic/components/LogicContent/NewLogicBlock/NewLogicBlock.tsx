import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import {
  cancelPendingSwitchSelector,
  completeSaveSelector,
  useAdminLogicStore,
} from '../../../adminLogicStore'
import { useLogicMutations } from '../../../mutations'
import { EditLogicInputs } from '../../../types'
import { EditLogicBlock } from '../EditLogicBlock'

export interface NewLogicBlockProps {
  /** Prop to inject values for testing */
  _defaultValues?: Partial<EditLogicInputs>
}

export const NewLogicBlock = ({
  _defaultValues,
}: NewLogicBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const { createLogicMutation } = useLogicMutations()
  const completeSave = useAdminLogicStore(completeSaveSelector)
  const cancelPendingSwitch = useAdminLogicStore(cancelPendingSwitchSelector)
  const handleSubmit = useCallback(
    (inputs: EditLogicInputs) =>
      createLogicMutation.mutate(inputs, {
        onSuccess: completeSave,
        // Drop any pending switch so a failed save can't redirect a later one.
        onError: cancelPendingSwitch,
      }),
    [createLogicMutation, completeSave, cancelPendingSwitch],
  )

  return (
    <EditLogicBlock
      isLoading={createLogicMutation.isLoading}
      defaultValues={_defaultValues}
      onSubmit={handleSubmit}
      submitButtonLabel={t('features.adminForm.sidebar.logic.addLogicBtn')}
    />
  )
}

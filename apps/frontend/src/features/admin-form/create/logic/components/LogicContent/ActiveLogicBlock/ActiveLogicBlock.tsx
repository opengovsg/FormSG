import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { LogicDto } from 'formsg-shared/types'

import {
  cancelPendingSwitchSelector,
  completeSaveSelector,
  useAdminLogicStore,
} from '../../../adminLogicStore'
import { useLogicMutations } from '../../../mutations'
import { EditLogicInputs } from '../../../types'
import { EditLogicBlock } from '../EditLogicBlock'

export interface ActiveLogicBlockProps {
  logic: LogicDto
  handleOpenDeleteModal: () => void
}

export const ActiveLogicBlock = ({
  logic,
  handleOpenDeleteModal,
}: ActiveLogicBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const { updateLogicMutation } = useLogicMutations()
  const completeSave = useAdminLogicStore(completeSaveSelector)
  const cancelPendingSwitch = useAdminLogicStore(cancelPendingSwitchSelector)
  const handleSubmit = useCallback(
    (inputs: EditLogicInputs) =>
      updateLogicMutation.mutate(
        { _id: logic._id, ...inputs },
        {
          onSuccess: completeSave,
          // Drop any pending switch so a failed save can't redirect a later one.
          onError: cancelPendingSwitch,
        },
      ),
    [logic._id, completeSave, cancelPendingSwitch, updateLogicMutation],
  )

  return (
    <EditLogicBlock
      isLoading={updateLogicMutation.isLoading}
      handleOpenDeleteModal={handleOpenDeleteModal}
      onSubmit={handleSubmit}
      defaultValues={logic}
      submitButtonLabel={t('features.adminForm.sidebar.logic.saveChangesBtn')}
    />
  )
}

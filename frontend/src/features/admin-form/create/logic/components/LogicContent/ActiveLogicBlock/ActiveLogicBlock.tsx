import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { LogicDto } from '~shared/types'

import {
  setToInactiveSelector,
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
  const setToInactive = useAdminLogicStore(setToInactiveSelector)
  const handleSubmit = useCallback(
    (inputs: EditLogicInputs) =>
      updateLogicMutation.mutate(
        { _id: logic._id, ...inputs },
        {
          onSuccess: () => setToInactive(),
        },
      ),
    [logic._id, setToInactive, updateLogicMutation],
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

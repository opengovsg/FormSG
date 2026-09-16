import { useCallback } from 'react'

import { BasicField } from 'formsg-shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  clearPendingFieldCreationSelector,
  stageFieldCreationSelector,
  useFieldBuilderStore,
} from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'
import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'
import { useCreatePageSidebar } from '~features/admin-form/create/common'

import {
  stashStepDraftSelector,
  useAdminWorkflowStore,
} from '../adminWorkflowStore'
import { EditStepInputs } from '../types'

export const useStageFieldAndNavigate = () => {
  const { handleBuilderClick } = useCreatePageSidebar()
  const stashStepDraft = useAdminWorkflowStore(stashStepDraftSelector)
  const stageFieldCreation = useFieldBuilderStore(stageFieldCreationSelector)
  const clearPendingFieldCreation = useFieldBuilderStore(
    clearPendingFieldCreationSelector,
  )
  const { data: form } = useAdminForm()
  const fieldCount = form?.form_fields?.length ?? 0

  return useCallback(
    (fieldType?: BasicField, draftInputs?: Partial<EditStepInputs>) => {
      if (draftInputs) {
        stashStepDraft(draftInputs)
      }
      handleBuilderClick(false)
      if (!fieldType) {
        clearPendingFieldCreation()
        return
      }
      stageFieldCreation(getFieldCreationMeta(fieldType), fieldCount)
    },
    [
      handleBuilderClick,
      stageFieldCreation,
      clearPendingFieldCreation,
      fieldCount,
      stashStepDraft,
    ],
  )
}

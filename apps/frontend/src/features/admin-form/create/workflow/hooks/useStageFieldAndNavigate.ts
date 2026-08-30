import { useCallback } from 'react'

import { BasicField } from 'formsg-shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  updateCreateStateSelector,
  useFieldBuilderStore,
} from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'
import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'
import { useCreatePageSidebar } from '~features/admin-form/create/common'

/**
 * Opens the field builder, optionally with a new field of `fieldType` staged
 * for creation. The admin still confirms; nothing is written to the form here.
 *
 * `handleBuilderClick(false)` is deliberate. Passing true routes through the
 * pending-tab machinery, which prompts on unsaved changes. That prompt is
 * noise on a trip the admin just asked for.
 */
export const useStageFieldAndNavigate = () => {
  const { handleBuilderClick } = useCreatePageSidebar()
  const updateCreateState = useFieldBuilderStore(updateCreateStateSelector)
  const { data: form } = useAdminForm()
  const fieldCount = form?.form_fields?.length ?? 0

  return useCallback(
    (fieldType?: BasicField) => {
      handleBuilderClick(false)
      if (!fieldType) return
      updateCreateState(getFieldCreationMeta(fieldType), fieldCount)
    },
    [handleBuilderClick, updateCreateState, fieldCount],
  )
}

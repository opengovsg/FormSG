import { useCallback } from 'react'

import { BasicField } from 'formsg-shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  stageFieldCreationSelector,
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
 *
 * The field is staged rather than written straight to the builder's state.
 * Opening the builder mounts BuilderAndDesignContent, which clears that state
 * as it mounts, so anything written here first would be gone on arrival.
 */
export const useStageFieldAndNavigate = () => {
  const { handleBuilderClick } = useCreatePageSidebar()
  const stageFieldCreation = useFieldBuilderStore(stageFieldCreationSelector)
  const { data: form } = useAdminForm()
  const fieldCount = form?.form_fields?.length ?? 0

  return useCallback(
    (fieldType?: BasicField) => {
      handleBuilderClick(false)
      if (!fieldType) return
      stageFieldCreation(getFieldCreationMeta(fieldType), fieldCount)
    },
    [handleBuilderClick, stageFieldCreation, fieldCount],
  )
}

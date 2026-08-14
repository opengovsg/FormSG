import { FormStatus } from 'formsg-shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useIsWorkflowBuilderRedesign } from './useIsWorkflowBuilderRedesign'

/**
 * Whether a half-built workflow step may be saved as-is.
 *
 * Building a workflow is not a linear task: an admin often knows which fields a
 * step needs before they know who fills them in. Blocking the save until every
 * answer is present forces them to invent a placeholder or lose the work.
 *
 * Two conditions, both required (FRM-2489):
 * - the redesign flag is on, so the old builder is untouched
 * - the form is `Private`, so nobody can submit to a workflow mid-build
 *
 * Deliberately keyed off `Private` rather than "not `Public`", so an unloaded
 * form is treated as strict. The backend applies the same rule and rejects an
 * incomplete step on a live form, so guessing permissive here would only
 * replace an inline message with a toast.
 */
export const useIsWorkflowSavePermissive = (): boolean => {
  const { data: form } = useAdminForm()
  const isRedesign = useIsWorkflowBuilderRedesign()

  return isRedesign && form?.status === FormStatus.Private
}

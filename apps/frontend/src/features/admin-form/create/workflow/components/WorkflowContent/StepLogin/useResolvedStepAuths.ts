import { useMemo } from 'react'

import {
  resolveAllStepAuths,
  ResolvedStepAuth,
} from 'formsg-shared/utils/workflow-auth'

import { useAdminForm } from '~features/admin-form/common/queries'

/** Every step's saved login in order (step 1 even with no steps); undefined while loading. */
export const useResolvedStepAuths = (): ResolvedStepAuth[] | undefined => {
  const { data: form } = useAdminForm()
  return useMemo(
    () =>
      form
        ? resolveAllStepAuths(form, 'workflow' in form ? form.workflow : [])
        : undefined,
    [form],
  )
}

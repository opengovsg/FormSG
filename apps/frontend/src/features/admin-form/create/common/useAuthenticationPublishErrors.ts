import { FormStatus } from 'formsg-shared/types'
import { getLoginFieldPublishErrors } from 'formsg-shared/utils/step-login'

import { useAdminForm } from '~features/admin-form/common/queries'

/** Draft warnings use the same field rules that the server checks on publish. */
export const useAuthenticationPublishErrors = (): string[] => {
  const { data: form } = useAdminForm()
  return form && form.status !== FormStatus.Public
    ? getLoginFieldPublishErrors(form)
    : []
}

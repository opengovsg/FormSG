import { FormStatus } from 'formsg-shared/types'
import {
  CORPPASS_STEPS_NEED_ESRVC_ID,
  getLoginFieldPublishErrors,
} from 'formsg-shared/utils/step-login'

import { useAdminForm } from '~features/admin-form/common/queries'

/**
 * Draft warnings use the same field rules that the server checks on publish.
 * The missing step e-service ID is left out: the form status toggle already
 * describes it.
 */
export const useAuthenticationPublishErrors = (): string[] => {
  const { data: form } = useAdminForm()
  return form && form.status !== FormStatus.Public
    ? getLoginFieldPublishErrors(form).filter(
        (error) => error !== CORPPASS_STEPS_NEED_ESRVC_ID,
      )
    : []
}

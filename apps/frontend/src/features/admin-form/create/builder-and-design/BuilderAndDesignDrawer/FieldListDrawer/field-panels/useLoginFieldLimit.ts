import { MAX_LOGIN_FIELDS } from 'formsg-shared/constants'
import { isLoginField } from 'formsg-shared/utils/login-identity'

import { useCreateTabForm } from '../../../useCreateTabForm'

/**
 * Usage of the per-form login field limit, which the MyInfo and Corppass
 * panels share.
 */
export const useLoginFieldLimit = () => {
  const { data: form } = useCreateTabForm()
  const count = form?.form_fields.filter(isLoginField).length ?? 0
  return {
    count,
    max: MAX_LOGIN_FIELDS,
    isAtLimit: count >= MAX_LOGIN_FIELDS,
  }
}

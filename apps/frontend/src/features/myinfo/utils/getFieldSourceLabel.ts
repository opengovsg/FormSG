import { FormField } from 'formsg-shared/types/field'
import {
  getLoginIdentityAttr,
  LOGIN_IDENTITY_LOGINS,
  LOGIN_IDENTITY_SOURCES,
} from 'formsg-shared/utils/login-identity'

import { isMyInfo } from './isMyInfo'

/** Where the field's value comes from, e.g. "Myinfo". */
export const getFieldSourceLabel = (field: FormField): string | undefined => {
  const identityAttr = getLoginIdentityAttr(field)
  if (identityAttr) return LOGIN_IDENTITY_SOURCES[identityAttr]
  return isMyInfo(field) ? 'Myinfo' : undefined
}

/** The login that fills the field, e.g. "Singpass", on NRIC/FIN fields only. */
export const getFieldLoginLabel = (field: FormField): string | undefined => {
  const identityAttr = getLoginIdentityAttr(field)
  return identityAttr ? LOGIN_IDENTITY_LOGINS[identityAttr] : undefined
}

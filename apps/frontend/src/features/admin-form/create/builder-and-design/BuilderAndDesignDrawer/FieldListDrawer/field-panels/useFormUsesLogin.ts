import { useCallback } from 'react'

import { FormAuthType } from 'formsg-shared/types'
import {
  getLoginIdentityAttrsForAuthType,
  LoginIdentityAttribute,
} from 'formsg-shared/utils/login-identity'

import { useIsMrfStepLoginEnabled } from '~features/admin-form/create/workflow/hooks/useIsMrfStepLoginEnabled'
import { formUsesLogin } from '~features/admin-form/create/workflow/utils/stepLoginAvailability'

import { useCreateTabForm } from '../../../useCreateTabForm'

const STEP_LOGIN_TYPES = [FormAuthType.MyInfo, FormAuthType.CP] as const

/**
 * Whether any step of the form logs in with the given login. The builder
 * offers a login's fields once one step can fill them; the workflow editor
 * then decides which step gets each field.
 */
export const useFormUsesLogin = () => {
  const { data: form } = useCreateTabForm()
  const isFlagOn = useIsMrfStepLoginEnabled()

  const usesLogin = useCallback(
    (authType: FormAuthType): boolean =>
      formUsesLogin({ form, authType, isFlagOn }),
    [form, isFlagOn],
  )

  const offersIdentityAttr = useCallback(
    (attr: LoginIdentityAttribute): boolean =>
      STEP_LOGIN_TYPES.some(
        (authType) =>
          usesLogin(authType) &&
          getLoginIdentityAttrsForAuthType(authType).includes(attr),
      ),
    [usesLogin],
  )

  return { usesLogin, offersIdentityAttr }
}

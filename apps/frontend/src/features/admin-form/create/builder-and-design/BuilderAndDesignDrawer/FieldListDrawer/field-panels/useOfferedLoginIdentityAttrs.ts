import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import {
  isLoginIdentityResponseMode,
  LoginIdentityAttribute,
} from 'formsg-shared/utils/login-identity'

import { useCreateTabForm } from '../../../useCreateTabForm'

import { filterLoginIdentityAttrs } from './utils'

/**
 * The identity options the builder offers for this search, or none when the
 * form cannot have identity fields.
 */
export const useOfferedLoginIdentityAttrs = (
  attrs: LoginIdentityAttribute[],
  searchValue: string,
) => {
  const { data: form } = useCreateTabForm()
  const isNricFieldEnabled = useFeatureIsOn(featureFlags.isNricFieldEnabled)
  return isNricFieldEnabled &&
    form &&
    isLoginIdentityResponseMode(form.responseMode)
    ? filterLoginIdentityAttrs(attrs, searchValue)
    : []
}

import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { BasicField } from 'formsg-shared/types/field'
import { isLoginIdentityField } from 'formsg-shared/utils/login-identity'

import { useIsMobile } from '~hooks/useIsMobile'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useCreatePageSidebar } from '../common/CreatePageSidebarContext'

import {
  updateEditStateSelector,
  useFieldBuilderStore,
} from './useFieldBuilderStore'

export const FOCUS_CONVERTED_IDENTITY_STATE = {
  focusConvertedIdentity: true,
} as const

const isConvertedIdentityArrival = (state: unknown): boolean =>
  !!(state as typeof FOCUS_CONVERTED_IDENTITY_STATE | null)
    ?.focusConvertedIdentity

export const useFocusConvertedIdentityField = () => {
  const { pathname, search, hash, state } = useLocation()
  const navigate = useNavigate()
  const shouldFocus = isConvertedIdentityArrival(state)
  const { data: form } = useAdminForm({ enabled: shouldFocus })
  const updateEditState = useFieldBuilderStore(updateEditStateSelector)
  const { handleBuilderClick } = useCreatePageSidebar()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!shouldFocus || !form) return
    const field = form.form_fields.find(
      (field) =>
        field.fieldType === BasicField.Nric && isLoginIdentityField(field),
    )
    if (!field) return

    updateEditState(field)
    // The mobile drawer would cover the field.
    if (!isMobile) handleBuilderClick(false)
    // Focus the converted field only once, even after a refresh.
    navigate({ pathname, search, hash }, { replace: true, state: null })
  }, [
    form,
    shouldFocus,
    updateEditState,
    handleBuilderClick,
    isMobile,
    navigate,
    pathname,
    search,
    hash,
  ])
}

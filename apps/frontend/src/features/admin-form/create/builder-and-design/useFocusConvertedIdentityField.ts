import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { BasicField } from 'formsg-shared/types/field'
import { isLoginIdentityField } from 'formsg-shared/utils/login-identity'

import { useIsMobile } from '~hooks/useIsMobile'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useCreatePageSidebar } from '../common/CreatePageSidebarContext'

import {
  FieldBuilderState,
  updateEditStateSelector,
  useFieldBuilderStore,
} from './useFieldBuilderStore'

export const FOCUS_CONVERTED_IDENTITY_STATE = {
  focusConvertedIdentity: true,
} as const

export const isConvertedIdentityArrival = (state: unknown): boolean =>
  !!(state as typeof FOCUS_CONVERTED_IDENTITY_STATE | null)
    ?.focusConvertedIdentity

/** Clears the arrival state, so the converted field is focused only once. */
export const useClearConvertedIdentityArrival = () => {
  const { pathname, search, hash } = useLocation()
  const navigate = useNavigate()
  return useCallback(
    () => navigate({ pathname, search, hash }, { replace: true, state: null }),
    [navigate, pathname, search, hash],
  )
}

export const useFocusConvertedIdentityField = () => {
  const location = useLocation()
  const clearArrival = useClearConvertedIdentityArrival()
  const shouldFocus = isConvertedIdentityArrival(location.state)
  // Only subscribe to the edited field while focusing one.
  const editingFieldId = useFieldBuilderStore((state) =>
    shouldFocus && state.stateData.state === FieldBuilderState.EditingField
      ? state.stateData.field._id
      : undefined,
  )
  const { data: form } = useAdminForm({ enabled: shouldFocus })
  const updateEditState = useFieldBuilderStore(updateEditStateSelector)
  const { handleBuilderClick } = useCreatePageSidebar()
  const isMobile = useIsMobile()
  const selectedId = useRef<string>()

  useEffect(() => {
    if (!shouldFocus) {
      selectedId.current = undefined
      return
    }
    if (selectedId.current) {
      if (editingFieldId !== selectedId.current) clearArrival()
      return
    }
    if (!form) return
    const field = form.form_fields.find(
      (field) =>
        field.fieldType === BasicField.Nric && isLoginIdentityField(field),
    )
    if (!field) return

    selectedId.current = field._id
    updateEditState(field)
    // The mobile drawer would cover the field and its explanation.
    if (!isMobile) handleBuilderClick(false)
  }, [
    form,
    shouldFocus,
    updateEditState,
    handleBuilderClick,
    isMobile,
    editingFieldId,
    clearArrival,
  ])
}

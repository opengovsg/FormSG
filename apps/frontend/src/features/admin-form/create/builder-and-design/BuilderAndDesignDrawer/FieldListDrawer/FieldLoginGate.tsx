import { ReactNode } from 'react'

import { useIsMrfStepLoginEnabled } from '~features/admin-form/create/workflow/hooks/useIsMrfStepLoginEnabled'
import { formUsesLogin } from '~features/admin-form/create/workflow/utils/stepLoginAvailability'

import { useCreateTabForm } from '../../useCreateTabForm'

import { FieldLoginContext, RequestField } from './FieldLoginContext'

/** Defensive click guard; missing-provider fields are disabled in the palette. */
export const FieldLoginGate = ({ children }: { children: ReactNode }) => {
  const { data: form } = useCreateTabForm()
  const enabled = useIsMrfStepLoginEnabled()
  const request: RequestField = (required, add) => {
    if (form && formUsesLogin({ form, authType: required, isFlagOn: enabled }))
      add()
  }
  return (
    <FieldLoginContext.Provider value={request}>
      {children}
    </FieldLoginContext.Provider>
  )
}

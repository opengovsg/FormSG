import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from 'react-query'

import { FormAuthType } from 'formsg-shared/types'

import { useToast } from '~hooks/useToast'

import { logoutPublicForm } from '../PublicFormService'
import {
  clearExpectedAuthFormId,
  getExpectedAuthFormId,
} from '../utils/authRedirectStorage'

export const useAuthFormMismatch = (formId?: string): boolean => {
  const { t } = useTranslation()
  const toast = useToast({
    isClosable: true,
  })
  const [expectedAuthFormId] = useState(getExpectedAuthFormId)
  const hasAuthFormMismatch =
    !!expectedAuthFormId && expectedAuthFormId !== formId
  const {
    isSuccess: hasClearedMyInfoSession,
    isError: hasFailedToClearMyInfoSession,
    mutate: clearMyInfoSession,
  } = useMutation(() => logoutPublicForm(FormAuthType.MyInfo))

  useEffect(() => {
    if (!expectedAuthFormId) return
    // StrictMode runs effects twice. The first pass clears the key, so the
    // second pass reads a different value and bails out instead of firing a
    // duplicate toast and logout.
    if (getExpectedAuthFormId() !== expectedAuthFormId) return

    clearExpectedAuthFormId()
    if (!hasAuthFormMismatch) return

    clearMyInfoSession()
    toast({
      status: 'danger',
      description: t('features.publicForm.errors.authFormMismatch'),
    })
  }, [clearMyInfoSession, expectedAuthFormId, hasAuthFormMismatch, t, toast])

  // Render the form once the logout call settles, successfully or not. A stale
  // cookie on a form the respondent is not filling beats a page that never
  // renders because the request failed.
  return (
    hasAuthFormMismatch &&
    !hasClearedMyInfoSession &&
    !hasFailedToClearMyInfoSession
  )
}

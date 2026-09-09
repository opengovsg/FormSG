import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from 'react-query'
import { FormAuthType } from 'formsg-shared/types'

import { useToast } from '~hooks/useToast'

import {
  clearExpectedAuthFormId,
  getExpectedAuthFormId,
} from '../utils/authRedirectStorage'
import { logoutPublicForm } from '../PublicFormService'

export const useAuthFormMismatch = (formId?: string): boolean => {
  const { t } = useTranslation()
  const toast = useToast({
    isClosable: true,
  })
  const [expectedAuthFormId] = useState(getExpectedAuthFormId)
  const hasAuthFormMismatch =
    !!expectedAuthFormId && expectedAuthFormId !== formId
  const { isSuccess: hasClearedMyInfoSession, mutate: clearMyInfoSession } =
    useMutation(() => logoutPublicForm(FormAuthType.MyInfo))

  useEffect(() => {
    if (!expectedAuthFormId) return
    if (getExpectedAuthFormId() !== expectedAuthFormId) return

    clearExpectedAuthFormId()
    if (!hasAuthFormMismatch) return

    clearMyInfoSession()
    toast({
      status: 'danger',
      description: t('features.publicForm.errors.authFormMismatch'),
    })
  }, [
    clearMyInfoSession,
    expectedAuthFormId,
    hasAuthFormMismatch,
    t,
    toast,
  ])

  return hasAuthFormMismatch && !hasClearedMyInfoSession
}

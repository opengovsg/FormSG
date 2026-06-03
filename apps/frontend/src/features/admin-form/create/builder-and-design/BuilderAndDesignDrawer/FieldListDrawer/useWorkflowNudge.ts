import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types'
import { BasicField } from 'formsg-shared/types/field'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  stepsSelector,
  useWorkflowBuilderStore,
} from '~features/admin-form/create/workflow-v2/workflowBuilderStore'

const TRIGGER_WORDS = ['application', 'request', 'endorsement', 'approval']
const LS_KEY = 'workflow-nudge-dismissed'

const getDismissedIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

export const useWorkflowNudge = (): {
  shouldShowNudge: boolean
  dismissNudge: () => void
} => {
  const { formId } = useParams()
  const { data: form } = useAdminForm()
  const steps = useWorkflowBuilderStore(stepsSelector)
  const isEnabled = useFeatureIsOn(featureFlags.workflowNudge as string)

  const [isDismissed, setIsDismissed] = useState(() =>
    formId ? getDismissedIds().includes(formId) : false,
  )

  const dismissNudge = useCallback(() => {
    if (!formId) return
    const ids = getDismissedIds()
    if (!ids.includes(formId)) {
      localStorage.setItem(LS_KEY, JSON.stringify([...ids, formId]))
    }
    setIsDismissed(true)
  }, [formId])

  const shouldShowNudge = useMemo(() => {
    if (!isEnabled || !form || !formId || isDismissed) return false
    if (form.responseMode !== FormResponseMode.Multirespondent) return false
    if (steps.length > 1) return false

    const titleLower = form.title.toLowerCase()
    const hasTriggerWord = TRIGGER_WORDS.some((word) =>
      titleLower.includes(word),
    )
    if (!hasTriggerWord) return false

    const emailCount = form.form_fields.filter(
      (f) => f.fieldType === BasicField.Email,
    ).length
    return emailCount >= 2
  }, [isEnabled, form, formId, isDismissed, steps.length])

  return { shouldShowNudge, dismissNudge }
}

import { useCallback, useEffect, useRef, useState } from 'react'

import { AdminFeedbackTriggerSource } from 'formsg-shared/types'

import { ADMIN_FEEDBACK_HISTORY_PREFIX } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

import { useEnv } from '~features/env/queries'

import AdminFeedbackBox from '../AdminFeedbackBox'

import {
  isEligibleSelector,
  resetSelector,
  useAdminFeedbackStore,
} from './adminFeedbackStore'

export const AdminFeedbackContainer = ({ userId }: { userId: string }) => {
  const { data: { adminFeedbackDisplayFrequency } = {} } = useEnv()
  const [isDisplayFeedback, setIsDisplayFeedback] = useState(false)

  const adminFeedbackKey = ADMIN_FEEDBACK_HISTORY_PREFIX + userId

  const [lastFeedbackTime, setLastFeedbackTime] =
    useLocalStorage<number>(adminFeedbackKey)
  const isAdminFeedbackEligible = useAdminFeedbackStore(isEligibleSelector)
  const resetAdminFeedbackEligible = useAdminFeedbackStore(resetSelector)

  // capture current time on page load to prevent re-renders from update to current time
  const currentTime = useRef(Date.now())
  // capture trigger metadata before reset clears the store
  const capturedTriggerSource = useRef<AdminFeedbackTriggerSource | null>(null)
  const capturedFormId = useRef<string | null>(null)

  // check if admin is eligible in current session
  // and has yet to seen feedback beyond our stipulated frequency
  const showAdminFeedback =
    isAdminFeedbackEligible &&
    // if feedbackTime has not been seen
    (!lastFeedbackTime ||
      // or if last feedback time seen is more than frequency (frequency env var must be defined)
      (!!adminFeedbackDisplayFrequency &&
        currentTime.current - lastFeedbackTime > adminFeedbackDisplayFrequency))

  // sets display of feedback box
  useEffect(() => {
    if (showAdminFeedback) {
      setIsDisplayFeedback(true)
      // reset local storage and admin feedback eligibility when admin feedback is displayed
      setLastFeedbackTime(currentTime.current)
      resetAdminFeedbackEligible()
    }
  }, [
    currentTime,
    showAdminFeedback,
    triggerSource,
    feedbackFormId,
    setIsDisplayFeedback,
    setLastFeedbackTime,
    resetAdminFeedbackEligible,
  ])

  const closeAdminFeedback = useCallback(
    () => setIsDisplayFeedback(false),
    [setIsDisplayFeedback],
  )
  return (
    <>
      {isDisplayFeedback && (
        <AdminFeedbackBox
          onClose={closeAdminFeedback}
          triggerSource={capturedTriggerSource.current ?? undefined}
          formId={capturedFormId.current ?? undefined}
        />
      )}
    </>
  )
}

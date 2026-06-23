import { useCallback, useEffect, useRef, useState } from 'react'

import { ADMIN_FEEDBACK_HISTORY_PREFIX } from '~constants/localStorage'
import { ADMIN_FEEDBACK_SESSION_KEY } from '~constants/sessionStorage'
import { useIsMobile } from '~hooks/useIsMobile'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { useSessionStorage } from '~hooks/useSessionStorage'

import { useEnv } from '~features/env/queries'

import AdminFeedbackBox from '../AdminFeedbackBox'

export const AdminFeedbackContainer = ({ userId }: { userId: string }) => {
  const { data: { adminFeedbackDisplayFrequency } = {} } = useEnv()
  const [isDisplayFeedback, setIsDisplayFeedback] = useState(false)
  const isMobile = useIsMobile()

  const adminFeedbackKey = ADMIN_FEEDBACK_HISTORY_PREFIX + userId

  const [lastFeedbackTime, setLastFeedbackTime] =
    useLocalStorage<number>(adminFeedbackKey)
  const [isAdminFeedbackEligible, setIsAdminFeedbackEligible] =
    useSessionStorage<boolean>(ADMIN_FEEDBACK_SESSION_KEY, false)

  // capture current time on page load to prevent re-renders from update to current time
  const currentTime = useRef(Date.now())

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
    if (
      // TODO: create mobile version of admin feedback
      !isMobile &&
      // whether to show admin the feedback box
      showAdminFeedback
    ) {
      setIsDisplayFeedback(true)
      // reset local storage and admin feedback eligibility when admin feedback is displayed
      setLastFeedbackTime(currentTime.current)
      setIsAdminFeedbackEligible(false)
    }
  }, [
    currentTime,
    showAdminFeedback,
    setIsDisplayFeedback,
    setLastFeedbackTime,
    setIsAdminFeedbackEligible,
    isMobile,
  ])

  const closeAdminFeedback = useCallback(
    () => setIsDisplayFeedback(false),
    [setIsDisplayFeedback],
  )
  return (
    <>
      {isDisplayFeedback && <AdminFeedbackBox onClose={closeAdminFeedback} />}
    </>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Flex, useDisclosure } from '@chakra-ui/react'

import { AdminNavBar } from '~/app/AdminNavBar'

import { ADMIN_FEEDBACK_HISTORY_PREFIX } from '~constants/localStorage'
import { ADMIN_FEEDBACK_SESSION_KEY } from '~constants/sessionStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { useSessionStorage } from '~hooks/useSessionStorage'
import { fillHeightCss } from '~utils/fillHeightCss'
import { getBannerProps } from '~utils/getBannerProps'
import { Banner } from '~components/Banner'

import { useEnv } from '~features/env/queries'
import { useUser } from '~features/user/queries'

import AdminFeedbackBox from './components/AdminFeedbackBox'
// TODO #4279: Remove after React rollout is complete
import CreateFormModal from './components/CreateFormModal'
import { WorkspacePageContent } from './components/WorkspacePageContent'
import { WorkspaceProvider } from './WorkspaceProvider'

export const CONTAINER_MAXW = '69.5rem'

export const WorkspacePage = (): JSX.Element => {
  const {
    data: {
      siteBannerContent,
      adminBannerContent,
      adminFeedbackDisplayFrequency,
    } = {},
  } = useEnv()
  const { user, isLoading } = useUser()
  const [isDisplayFeedback, setIsDisplayFeedback] = useState(false)

  const adminFeedbackKey = useMemo(() => {
    return ADMIN_FEEDBACK_HISTORY_PREFIX + user?._id
  }, [user])

  const [lastFeedbackTime, setLastFeedbackTime] =
    useLocalStorage<number>(adminFeedbackKey)
  const [isAdminFeedbackEligible, setIsAdminFeedbackEligible] =
    useSessionStorage<boolean>(ADMIN_FEEDBACK_SESSION_KEY, false)

  // Memo current time on page load to prevent re-renders from update to current time
  const currentTime = useMemo(() => Date.now(), [])

  const bannerContent = useMemo(
    // Use || instead of ?? so that we fall through even if previous banners are empty string.
    () => siteBannerContent || adminBannerContent,
    [adminBannerContent, siteBannerContent],
  )

  const bannerProps = useMemo(
    () => getBannerProps(bannerContent),
    [bannerContent],
  )

  const createFormModalDisclosure = useDisclosure()

  // Whether to display the admin feedback based on session eligibility and time of prev feedback seen
  useEffect(() => {
    if (
      // user details is loaded
      !isLoading &&
      // admin session eligibility
      isAdminFeedbackEligible &&
      // if feedbackTime has not been seen
      (!lastFeedbackTime ||
        // or if last feedback time seen is more than frequency (frequency env var must be defined)
        (!!adminFeedbackDisplayFrequency &&
          currentTime - lastFeedbackTime > adminFeedbackDisplayFrequency))
    ) {
      setIsDisplayFeedback(true)
      // reset local storage and admin feedback eligibility when admin feedback is displayed
      setLastFeedbackTime(currentTime)
      setIsAdminFeedbackEligible(false)
    }
  }, [
    isLoading,
    lastFeedbackTime,
    currentTime,
    isAdminFeedbackEligible,
    adminFeedbackDisplayFrequency,
    setIsDisplayFeedback,
    setLastFeedbackTime,
    setIsAdminFeedbackEligible,
  ])

  const closeAdminFeedback = useCallback(
    () => setIsDisplayFeedback(false),
    [setIsDisplayFeedback],
  )

  return (
    <>
      <CreateFormModal
        isOpen={createFormModalDisclosure.isOpen}
        onClose={createFormModalDisclosure.onClose}
      />
      <Flex direction="column" css={fillHeightCss}>
        {bannerProps ? (
          <Banner useMarkdown variant={bannerProps.variant}>
            {bannerProps.msg}
          </Banner>
        ) : null}
        <AdminNavBar />
        <WorkspaceProvider>
          <WorkspacePageContent
            handleCreateFormModalOpen={createFormModalDisclosure.onOpen}
          />
        </WorkspaceProvider>
      </Flex>
      {isDisplayFeedback && <AdminFeedbackBox onClose={closeAdminFeedback} />}
    </>
  )
}

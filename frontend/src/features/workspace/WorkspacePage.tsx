import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Flex, useDisclosure } from '@chakra-ui/react'

import { AdminNavBar } from '~/app/AdminNavBar'

import { ADMIN_FEEDBACK_HISTORY_PREFIX } from '~constants/localStorage'
import { ADMIN_FEEDBACK_SESSION_KEY } from '~constants/sessionStorage'
import { useIsMobile } from '~hooks/useIsMobile'
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
  const isMobile = useIsMobile()

  const adminFeedbackKey = useMemo(() => {
    return ADMIN_FEEDBACK_HISTORY_PREFIX + user?._id
  }, [user])

  const [lastFeedbackTime, setLastFeedbackTime] =
    useLocalStorage<number>(adminFeedbackKey)
  const [isAdminFeedbackEligible, setIsAdminFeedbackEligible] =
    useSessionStorage<boolean>(ADMIN_FEEDBACK_SESSION_KEY, false)

  // capture current time on page load to prevent re-renders from update to current time
  const currentTime = useRef(Date.now())

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

  // check if admin is eligible in current session
  // and has yet to seen feedback beyond our stipulated frequency
  const showAdminFeedback =
    isAdminFeedbackEligible &&
    // user details is loaded
    !isLoading &&
    // if feedbackTime has not been seen
    (!lastFeedbackTime ||
      // or if last feedback time seen is more than frequency (frequency env var must be defined)
      (!!adminFeedbackDisplayFrequency &&
        currentTime.current - lastFeedbackTime > adminFeedbackDisplayFrequency))

  // sets display of feedback box
  useEffect(() => {
    if (
      // // user details is loaded
      // !isLoading &&
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
    // isLoading,
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

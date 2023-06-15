import { useMemo } from 'react'
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

import { AdminFeedbackModal } from './components/AdminFeedbackModal/AdminFeedbackModal'
// TODO #4279: Remove after React rollout is complete
import CreateFormModal from './components/CreateFormModal'
import { WorkspacePageContent } from './components/WorkspacePageContent'
import { WorkspaceProvider } from './WorkspaceProvider'

export const CONTAINER_MAXW = '69.5rem'

export const WorkspacePage = (): JSX.Element => {
  const { data: { siteBannerContent, adminBannerContent } = {} } = useEnv()
  const [lastFeedbackTime, setLastFeedbackTime] = useLocalStorage<number>(
    ADMIN_FEEDBACK_HISTORY_PREFIX,
  )
  const [isAdminFeedbackEligible, setAdminFeedbackEligible] =
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

  // Whether to display the feedback based on session eligibity and time of prev feedback seen
  const isDisplayFeedback = useMemo(
    () =>
      isAdminFeedbackEligible &&
      (!lastFeedbackTime || currentTime - lastFeedbackTime > 100000),
    [lastFeedbackTime, currentTime, isAdminFeedbackEligible],
  )

  const createFormModalDisclosure = useDisclosure()
  const adminFeedbackModalDisclosure = useDisclosure({
    defaultIsOpen: isDisplayFeedback,
  })

  const onAdminFeedbackModalOpen = () => {
    setLastFeedbackTime(currentTime)
    setAdminFeedbackEligible(false)
  }

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
      <AdminFeedbackModal
        isOpen={adminFeedbackModalDisclosure.isOpen}
        onClose={adminFeedbackModalDisclosure.onClose}
        onOpen={onAdminFeedbackModalOpen}
      />
    </>
  )
}

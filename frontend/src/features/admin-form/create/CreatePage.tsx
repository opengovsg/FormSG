import { Flex } from '@chakra-ui/react'

import { FEATURE_TOUR_KEY_PREFIX } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

import { useUser } from '~features/user/queries'

import { CreatePageContent } from './common/CreatePageContent'
import { CreatePageSidebar } from './common/CreatePageSidebar'
import { CreatePageSidebarProvider } from './common/CreatePageSidebarContext'
import { FeatureTour } from './featureTour/FeatureTour'

interface CreatePageProps {
  testUserId?: string
}

export const CreatePage = ({ testUserId }: CreatePageProps): JSX.Element => {
  const { user, isLoading } = useUser()
  // User id will never undefined unless it's in storybook testing because
  // user will have to be logged in to be able to reach this page
  const userId = user?._id ?? testUserId
  const localStorageFeatureTourKey = FEATURE_TOUR_KEY_PREFIX + userId
  const [hasAdminSeenFeatureTour, setHasAdminSeenFeatureTour] =
    useLocalStorage<boolean>(localStorageFeatureTourKey)

  return (
    <Flex h="100%" w="100%" overflow="auto" bg="neutral.200" direction="row">
      <CreatePageSidebarProvider>
        {!isLoading && (
          <FeatureTour
            shouldRun={!hasAdminSeenFeatureTour ?? true}
            onClose={() => setHasAdminSeenFeatureTour(true)}
          />
        )}
        <CreatePageSidebar />
        <CreatePageContent />
      </CreatePageSidebarProvider>
    </Flex>
  )
}

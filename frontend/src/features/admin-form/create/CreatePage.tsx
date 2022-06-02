import { Flex } from '@chakra-ui/react'

import { FEATURE_TOUR_KEY_PREFIX } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

import { useUser } from '~features/user/queries'

import { CreatePageContent } from './common/CreatePageContent'
import { CreatePageSidebar } from './common/CreatePageSidebar'
import { CreatePageSidebarProvider } from './common/CreatePageSidebarContext'
import { FeatureTour } from './featureTour/FeatureTour'

export const CreatePage = (): JSX.Element => {
  const { user, isLoading } = useUser()
  const localStorageFeatureTourKey = FEATURE_TOUR_KEY_PREFIX + user?._id
  const [shouldFeatureRun, setShouldFeatureTourRun] = useLocalStorage<boolean>(
    localStorageFeatureTourKey,
  )

  return (
    <Flex h="100%" w="100%" overflow="auto" bg="neutral.200" direction="row">
      <CreatePageSidebarProvider>
        {!isLoading && (
          <FeatureTour
            shouldRun={!shouldFeatureRun ?? true}
            onClose={() => setShouldFeatureTourRun(true)}
          />
        )}
        <CreatePageSidebar />
        <CreatePageContent />
      </CreatePageSidebarProvider>
    </Flex>
  )
}

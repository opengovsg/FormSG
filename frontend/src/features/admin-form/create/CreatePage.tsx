import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { FEATURE_TOUR_KEY_PREFIX } from '~constants/localStorage'
import { ADMINFORM_RESULTS_SUBROUTE, ADMINFORM_ROUTE } from '~constants/routes'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { NavigationPrompt } from '~templates/NavigationPrompt'

import { useUser } from '~features/user/queries'

import { DirtyModal } from '../common/components/DirtyModal'
import { useAdminFormCollaborators } from '../common/queries'

import {
  isDirtySelector,
  useDirtyFieldStore,
} from './builder-and-design/useDirtyFieldStore'
import { CreatePageContent } from './common/CreatePageContent'
import { CreatePageSidebar } from './common/CreatePageSidebar'
import { CreatePageSidebarProvider } from './common/CreatePageSidebarContext'
import { FeatureTour } from './featureTour/FeatureTour'

export const CreatePage = (): JSX.Element => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { hasEditAccess, isLoading: isCollabLoading } =
    useAdminFormCollaborators(formId)
  const navigate = useNavigate()

  // Redirect view-only collaborators to results screen.
  useEffect(() => {
    if (!isCollabLoading && !hasEditAccess)
      navigate(`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}`)
  }, [formId, hasEditAccess, isCollabLoading, navigate])

  const { user, isLoading } = useUser()
  const localStorageFeatureTourKey = useMemo(() => {
    if (!user?._id) {
      return null
    }
    return `${FEATURE_TOUR_KEY_PREFIX}${user?._id}`
  }, [user?._id])
  const [hasAdminSeenFeatureTour, setHasAdminSeenFeatureTour] =
    useLocalStorage<boolean>(localStorageFeatureTourKey)

  const shouldFeatureTourRender = useMemo(() => {
    return !isLoading && !hasAdminSeenFeatureTour
  }, [isLoading, hasAdminSeenFeatureTour])

  const isDirty = useDirtyFieldStore(isDirtySelector)

  return (
    <>
      <NavigationPrompt when={isDirty} />
      <CreatePageSidebarProvider>
        <DirtyModal />
        <Flex
          h="100%"
          w="100%"
          overflow="auto !important"
          bg="neutral.200"
          direction="row"
        >
          {shouldFeatureTourRender && (
            <FeatureTour onClose={() => setHasAdminSeenFeatureTour(true)} />
          )}
          <CreatePageSidebar />
          <CreatePageContent />
        </Flex>
      </CreatePageSidebarProvider>
    </>
  )
}

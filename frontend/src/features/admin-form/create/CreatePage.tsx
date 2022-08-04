import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { FEATURE_TOUR_KEY_PREFIX } from '~constants/localStorage'
import { ADMINFORM_RESULTS_SUBROUTE, ADMINFORM_ROUTE } from '~constants/routes'
import { useLocalStorage } from '~hooks/useLocalStorage'

import { useUser } from '~features/user/queries'

import { useAdminFormCollaborators } from '../common/queries'

import { CreatePageContent } from './common/CreatePageContent'
import { CreatePageSidebar } from './common/CreatePageSidebar'
import { CreatePageSidebarProvider } from './common/CreatePageSidebarContext'
import { FeatureTour } from './featureTour/FeatureTour'

export const CreatePage = (): JSX.Element => {
  const { formId } = useParams()
  const { hasEditAccess } = useAdminFormCollaborators()
  const navigate = useNavigate()

  useEffect(() => {
    if (!hasEditAccess)
      navigate(`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}`)
  }, [formId, hasEditAccess, navigate])

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

  return (
    <Flex h="100%" w="100%" overflow="auto" bg="neutral.200" direction="row">
      <CreatePageSidebarProvider>
        {shouldFeatureTourRender && (
          <FeatureTour onClose={() => setHasAdminSeenFeatureTour(true)} />
        )}
        <CreatePageSidebar />
        <CreatePageContent />
      </CreatePageSidebarProvider>
    </Flex>
  )
}

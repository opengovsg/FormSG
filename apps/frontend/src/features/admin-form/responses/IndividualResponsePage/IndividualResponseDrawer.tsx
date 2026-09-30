import { useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
} from '@chakra-ui/react'

import { ADMINFORM_RESULTS_SUBROUTE, ADMINFORM_ROUTE } from '~constants/routes'

import { useUnlockedResponses } from '../ResponsesPage/storage/UnlockedResponses/UnlockedResponsesProvider'

import { IndividualResponsePage } from './IndividualResponsePage'
import { IndividualResponseTitle } from './IndividualResponseTitle'

export const IndividualResponseDrawer = (): JSX.Element => {
  const { formId } = useParams()
  const navigate = useNavigate()
  const { lastNavPage, lastNavSubmissionId } = useUnlockedResponses()

  // Closing lands back on the page and search the admin opened the response
  // from, so the paginated table underneath does not snap back to page 1.
  const closeSearch = useMemo(() => {
    const searchParams = new URLSearchParams()
    if (lastNavPage && lastNavPage > 1) {
      searchParams.set('page', lastNavPage.toString())
    }
    if (lastNavSubmissionId) {
      searchParams.set('submissionId', lastNavSubmissionId)
    }
    const search = searchParams.toString()
    return search ? `?${search}` : ''
  }, [lastNavPage, lastNavSubmissionId])

  const onClose = useCallback(
    () =>
      navigate(
        `${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}${closeSearch}`,
      ),
    [closeSearch, formId, navigate],
  )

  return (
    <Drawer isOpen placement="right" size="lg" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader
          display="flex"
          borderBottomWidth="1px"
          borderBottomColor="neutral.300"
        >
          <IndividualResponseTitle textStyle="h4" />
        </DrawerHeader>
        <DrawerBody px={0} py="1.5rem">
          <IndividualResponsePage />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

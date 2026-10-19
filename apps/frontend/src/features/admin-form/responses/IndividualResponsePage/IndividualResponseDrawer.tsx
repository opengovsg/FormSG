import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiChevronDown, BiChevronUp } from 'react-icons/bi'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ButtonGroup,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
} from '@chakra-ui/react'

import { SubmissionMetadata } from 'formsg-shared/types'

import { ADMINFORM_RESULTS_SUBROUTE, ADMINFORM_ROUTE } from '~constants/routes'
import IconButton from '~components/IconButton'

import { useStorageResponsesContext } from '../ResponsesPage/storage'
import { useUnlockedResponses } from '../ResponsesPage/storage/UnlockedResponses/UnlockedResponsesProvider'

import { IndividualResponsePage } from './IndividualResponsePage'
import { IndividualResponseTitle } from './IndividualResponseTitle'

export const IndividualResponseDrawer = (): JSX.Element | null => {
  const { t } = useTranslation()
  const { formId, submissionId } = useParams()
  if (!submissionId) throw new Error('Missing submissionId')
  const navigate = useNavigate()
  const {
    lastNavPage,
    lastNavSubmissionId,
    getAdjacentSubmissions,
    onNavigateToSubmission,
  } = useUnlockedResponses()
  const { secretKey } = useStorageResponsesContext()
  const resultsRoute = `${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}`

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
    () => navigate(`${resultsRoute}${closeSearch}`),
    [closeSearch, navigate, resultsRoute],
  )

  const { previous, next } = getAdjacentSubmissions(submissionId)
  const openResponse = useCallback(
    (target: SubmissionMetadata) => {
      navigate(`${resultsRoute}/${target.refNo}`, {
        state: { responseNumber: target.number },
      })
      onNavigateToSubmission(target.refNo)
    },
    [navigate, onNavigateToSubmission, resultsRoute],
  )

  // The page underneath shows the secret-key form; a second copy inside the
  // drawer only hid it. The drawer opens once the key is in.
  if (!secretKey) return null

  return (
    <Drawer isOpen placement="right" size="lg" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader
          display="flex"
          alignItems="center"
          gap="0.5rem"
          px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
          borderBottomWidth="1px"
          borderBottomColor="neutral.300"
        >
          <ButtonGroup spacing="0.25rem" alignItems="center" flexShrink={0}>
            <IconButton
              variant="clear"
              icon={<BiChevronUp />}
              isDisabled={!previous}
              onClick={() => previous && openResponse(previous)}
              aria-label={t(
                'features.adminForm.responses.individualResponse.previousResponse',
              )}
            />
            <IconButton
              variant="clear"
              icon={<BiChevronDown />}
              isDisabled={!next}
              onClick={() => next && openResponse(next)}
              aria-label={t(
                'features.adminForm.responses.individualResponse.nextResponse',
              )}
            />
          </ButtonGroup>
          <IndividualResponseTitle textStyle="h4" />
          <DrawerCloseButton
            ml="auto"
            position="static"
            boxSize="2.75rem"
            flexShrink={0}
          />
        </DrawerHeader>
        <DrawerBody px={0} py="1.5rem">
          <IndividualResponsePage />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

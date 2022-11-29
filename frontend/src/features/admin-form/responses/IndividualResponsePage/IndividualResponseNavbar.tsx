import { useCallback, useMemo } from 'react'
import { BiChevronLeft, BiChevronRight, BiLeftArrowAlt } from 'react-icons/bi'
import {
  Link as ReactLink,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  ButtonGroup,
  Flex,
  Grid,
  Icon,
  Link,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import { noPrintCss } from '~utils/noPrintCss'
import IconButton from '~components/IconButton'

import { useUnlockedResponses } from '../ResponsesPage/storage/UnlockedResponses/UnlockedResponsesProvider'

import { useIndividualSubmission } from './queries'

export const IndividualResponseNavbar = (): JSX.Element => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { submissionId } = useParams()
  if (!submissionId) throw new Error('Missing submissionId')

  const currentRespondentNumber = useMemo(() => {
    return (state as { respondentNumber?: number })?.respondentNumber
  }, [state])

  const {
    lastNavPage,
    lastNavSubmissionId,
    getNextSubmissionId,
    getPreviousSubmissionId,
    onNavNextSubmissionId,
    onNavPreviousSubmissionId,
    isAnyFetching,
  } = useUnlockedResponses()
  const { isLoading } = useIndividualSubmission()

  const nextSubmissionId = useMemo(
    () => getNextSubmissionId(submissionId),
    [getNextSubmissionId, submissionId],
  )
  const prevSubmissionId = useMemo(
    () => getPreviousSubmissionId(submissionId),
    [getPreviousSubmissionId, submissionId],
  )

  const handleNavigateNext = useCallback(() => {
    if (!nextSubmissionId) return
    navigate(`../${nextSubmissionId}`, {
      state: {
        respondentNumber: currentRespondentNumber
          ? currentRespondentNumber - 1
          : undefined,
      },
    })
    onNavNextSubmissionId(submissionId)
  }, [
    currentRespondentNumber,
    navigate,
    nextSubmissionId,
    onNavNextSubmissionId,
    submissionId,
  ])

  const handleNavigatePrev = useCallback(() => {
    if (!prevSubmissionId) return
    navigate(`../${prevSubmissionId}`, {
      state: {
        respondentNumber: currentRespondentNumber
          ? currentRespondentNumber + 1
          : undefined,
      },
    })
    onNavPreviousSubmissionId(submissionId)
  }, [
    currentRespondentNumber,
    navigate,
    onNavPreviousSubmissionId,
    prevSubmissionId,
    submissionId,
  ])

  const backLink = useMemo(() => {
    if (!lastNavPage && !lastNavSubmissionId) return `..`
    const searchParams = new URLSearchParams()
    if (lastNavPage) searchParams.set('page', lastNavPage.toString())
    if (lastNavSubmissionId) {
      searchParams.set('submissionId', lastNavSubmissionId)
    }
    return `..?${searchParams}`
  }, [lastNavPage, lastNavSubmissionId])

  return (
    <Grid
      sx={noPrintCss}
      position="sticky"
      top={0}
      bg="white"
      zIndex="docked"
      templateAreas={{
        base: "'back navigate' 'respondent respondent'",
        md: "'back respondent navigate'",
      }}
      templateColumns={{ base: '1fr auto', md: 'auto 1fr auto' }}
      rowGap={{ base: '1.5rem', md: '2.5rem' }}
      py={{ base: '1.5rem', md: '3rem' }}
    >
      <Flex gridArea="back" align="center">
        <Link
          display="inline-flex"
          as={ReactLink}
          variant="standalone"
          to={backLink}
        >
          <Icon as={BiLeftArrowAlt} fontSize="1.5rem" mr="0.5rem" />
          Back to list
        </Link>
      </Flex>
      <Flex gridArea="respondent" justify="center" align="center">
        <Skeleton isLoaded={!isLoading}>
          <Text textStyle="h2" as="h2">
            Respondent
            {currentRespondentNumber ? ` #${currentRespondentNumber}` : ''}
          </Text>
        </Skeleton>
      </Flex>
      <ButtonGroup gridArea="navigate">
        <IconButton
          isDisabled={!prevSubmissionId || isAnyFetching}
          onClick={handleNavigatePrev}
          icon={<BiChevronLeft />}
          aria-label="Previous submission"
        />
        <IconButton
          isDisabled={!nextSubmissionId || isAnyFetching}
          onClick={handleNavigateNext}
          icon={<BiChevronRight />}
          aria-label="Next submission"
        />
      </ButtonGroup>
    </Grid>
  )
}

import { memo, useCallback, useMemo } from 'react'
import { BiChevronLeft, BiChevronRight, BiLeftArrowAlt } from 'react-icons/bi'
import { Link as ReactLink, useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  ButtonGroup,
  Grid,
  Icon,
  Link,
  Skeleton,
  Stack,
  StackDivider,
  Text,
} from '@chakra-ui/react'

import IconButton from '~components/IconButton'

import {
  SecretKeyVerification,
  useStorageResponsesContext,
} from '../ResponsesPage/storage'
import { useUnlockedResponses } from '../ResponsesPage/storage/UnlockedResponses/UnlockedResponsesProvider'

import { DecryptedRow } from './DecryptedRow'
import { useIndividualSubmission } from './queries'

const LoadingDecryption = memo(() => {
  return (
    <Stack spacing="1.5rem" divider={<StackDivider />}>
      <Skeleton h="2rem" maxW="20rem" mb="0.5rem" />
      <Stack>
        <Skeleton h="1.5rem" maxW="32rem" />
        <Skeleton h="1.5rem" maxW="5rem" />
      </Stack>
      <Stack>
        <Skeleton h="1.5rem" maxW="12rem" />
        <Skeleton h="1.5rem" maxW="5rem" />
      </Stack>
      <Stack>
        <Skeleton h="1.5rem" maxW="24rem" />
        <Skeleton h="1.5rem" maxW="3rem" />
      </Stack>
      <Box />
    </Stack>
  )
})

export const IndividualResponsePage = (): JSX.Element => {
  const navigate = useNavigate()
  const { submissionId } = useParams()
  if (!submissionId) throw new Error('Missing submissionId')

  const { secretKey } = useStorageResponsesContext()
  const {
    lastNavPage,
    getNextSubmissionId,
    getPreviousSubmissionId,
    onNavNextSubmissionId,
    onNavPreviousSubmissionId,
  } = useUnlockedResponses()
  const { data, isLoading } = useIndividualSubmission()

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
    navigate(`../${nextSubmissionId}`)
    onNavNextSubmissionId(submissionId)
  }, [navigate, nextSubmissionId, onNavNextSubmissionId, submissionId])

  const handleNavigatePrev = useCallback(() => {
    if (!prevSubmissionId) return
    navigate(`../${prevSubmissionId}`)
    onNavPreviousSubmissionId(submissionId)
  }, [navigate, onNavPreviousSubmissionId, prevSubmissionId, submissionId])

  const backLink = useMemo(() => {
    if (lastNavPage) {
      return `..?page=${lastNavPage}`
    }
    return `..`
  }, [lastNavPage])

  if (!secretKey) {
    return <SecretKeyVerification />
  }

  return (
    <Grid
      px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
      columnGap={{ base: '0.5rem', lg: '1rem' }}
      templateColumns={{ base: 'repeat(4, 1fr)', md: 'repeat(12, 1fr)' }}
    >
      <Stack spacing="2.5rem" gridColumn="2 / -2">
        <Stack direction="row" justify="space-between" align="center">
          <Link
            display="inline-flex"
            as={ReactLink}
            variant="standalone"
            to={backLink}
          >
            <Icon as={BiLeftArrowAlt} fontSize="1.5rem" mr="0.5rem" />
            Back to list
          </Link>
          <Skeleton isLoaded={!isLoading}>
            <Text textStyle="h2" as="h2">
              {/* TODO: add respondent number according to position in table, if exists */}
              Respondent #2
            </Text>
          </Skeleton>
          <ButtonGroup>
            <IconButton
              isDisabled={!prevSubmissionId}
              onClick={handleNavigatePrev}
              icon={<BiChevronLeft />}
              aria-label="Previous submission"
            />
            <IconButton
              isDisabled={!nextSubmissionId}
              onClick={handleNavigateNext}
              icon={<BiChevronRight />}
              aria-label="Next submission"
            />
          </ButtonGroup>
        </Stack>
        <Stack
          bg="primary.100"
          p="1.5rem"
          sx={{
            fontFeatureSettings: "'tnum' on, 'lnum' on, 'zero' on, 'cv05' on",
          }}
        >
          <Text display="inline-flex">
            <Text as="span" textStyle="subhead-1">
              Reference number:
            </Text>
            &nbsp;{submissionId}
          </Text>
          <Box display="inline-flex">
            <Text as="span" textStyle="subhead-1">
              Time:
            </Text>
            <Skeleton isLoaded={!isLoading}>
              &nbsp;{data?.submissionTime ?? 'Loading...'}
            </Skeleton>
          </Box>
        </Stack>
        <Stack>
          {isLoading ? (
            <LoadingDecryption />
          ) : (
            <Stack spacing="1.5rem" divider={<StackDivider />}>
              {data?.responses.map((r, idx) => (
                <DecryptedRow row={r} secretKey={secretKey} key={idx} />
              ))}
              <Box />
            </Stack>
          )}
        </Stack>
      </Stack>
    </Grid>
  )
}

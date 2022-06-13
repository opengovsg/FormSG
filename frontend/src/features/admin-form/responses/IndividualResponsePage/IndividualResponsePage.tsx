import { memo, useCallback, useMemo } from 'react'
import {
  BiChevronLeft,
  BiChevronRight,
  BiLeftArrow,
  BiLeftArrowAlt,
} from 'react-icons/bi'
import { Link as ReactLink, useParams } from 'react-router-dom'
import {
  Box,
  ButtonGroup,
  Flex,
  Grid,
  Icon,
  Link,
  Skeleton,
  Stack,
  StackDivider,
  Text,
} from '@chakra-ui/react'
import { times } from 'lodash'

import IconButton from '~components/IconButton'

import {
  SecretKeyVerification,
  useStorageResponsesContext,
} from '../ResponsesPage/storage'
import { useUnlockedResponses } from '../ResponsesPage/storage/UnlockedResponses/UnlockedResponsesProvider'

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
  const { submissionId } = useParams()
  if (!submissionId) throw new Error('Missing submissionId')

  const { secretKey } = useStorageResponsesContext()
  const { lastNavPage, getNextSubmissionId, getPreviousSubmissionId } =
    useUnlockedResponses()
  const { data, isLoading } = useIndividualSubmission()

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
              Respondent #2
            </Text>
          </Skeleton>
          <ButtonGroup>
            <IconButton
              icon={<BiChevronLeft />}
              aria-label="Previous submission"
            />
            <IconButton
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
          <LoadingDecryption />
          {data?.responses.map((r) => (
            <div>{JSON.stringify(r)}</div>
          ))}
        </Stack>
      </Stack>
    </Grid>
  )
}

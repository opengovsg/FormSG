import { useCallback, useMemo } from 'react'
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
  Text,
} from '@chakra-ui/react'

import { ADMINFORM_RESULTS_SUBROUTE, ADMINFORM_ROUTE } from '~constants/routes'
import IconButton from '~components/IconButton'

import {
  SecretKeyVerification,
  useStorageResponsesContext,
} from '../ResponsesPage/storage'
import { useUnlockedResponses } from '../ResponsesPage/storage/UnlockedResponses/UnlockedResponsesProvider'

export const IndividualResponsePage = (): JSX.Element => {
  const { submissionId } = useParams()
  if (!submissionId) throw new Error('Missing submissionId')

  const { secretKey } = useStorageResponsesContext()
  const { lastNavPage } = useUnlockedResponses()

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
      <Stack direction="row" gridColumn="2 / -2" justify="space-between">
        <Link
          display="inline-flex"
          as={ReactLink}
          variant="standalone"
          to={backLink}
        >
          <Icon as={BiLeftArrowAlt} fontSize="1.5rem" mr="0.5rem" />
          Back to list
        </Link>
        <Skeleton>
          <Text textStyle="h2" as="h2">
            Respondent #2
          </Text>
        </Skeleton>
        <ButtonGroup>
          <IconButton
            icon={<BiChevronLeft />}
            aria-label="Previous submission"
          />
          <IconButton icon={<BiChevronRight />} aria-label="Next submission" />
        </ButtonGroup>
      </Stack>
    </Grid>
  )
}

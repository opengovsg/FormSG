import { memo, useCallback, useMemo } from 'react'
import {
  BiChevronLeft,
  BiChevronRight,
  BiDownload,
  BiLeftArrowAlt,
} from 'react-icons/bi'
import {
  Link as ReactLink,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
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
import simplur from 'simplur'

import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Spinner from '~components/Spinner'

import {
  SecretKeyVerification,
  useStorageResponsesContext,
} from '../ResponsesPage/storage'
import { useUnlockedResponses } from '../ResponsesPage/storage/UnlockedResponses/UnlockedResponsesProvider'

import { DecryptedRow } from './DecryptedRow'
import { useMutateDownloadAttachments } from './mutations'
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
  const { state } = useLocation()
  const navigate = useNavigate()
  const { submissionId } = useParams()
  if (!submissionId) throw new Error('Missing submissionId')

  const currentRespondentNumber = useMemo(() => {
    return (state as { respondentNumber?: number })?.respondentNumber
  }, [state])

  const { secretKey } = useStorageResponsesContext()
  const {
    lastNavPage,
    lastNavSubmissionId,
    getNextSubmissionId,
    getPreviousSubmissionId,
    onNavNextSubmissionId,
    onNavPreviousSubmissionId,
    isAnyFetching,
  } = useUnlockedResponses()
  const { data, isLoading, isError } = useIndividualSubmission()

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
    if (!lastNavPage && !lastNavSubmissionId) {
      return `..`
    }

    const searchParams = new URLSearchParams()
    if (lastNavPage) {
      searchParams.set('page', lastNavPage.toString())
    }
    if (lastNavSubmissionId) {
      searchParams.set('submissionId', lastNavSubmissionId)
    }
    return `..?${searchParams}`
  }, [lastNavPage, lastNavSubmissionId])

  const attachmentDownloadUrls = useMemo(() => {
    const attachmentDownloadUrls = new Map()
    data?.responses.forEach(({ questionNumber, downloadUrl, answer }) => {
      if (!questionNumber || !downloadUrl || !answer) return
      attachmentDownloadUrls.set(questionNumber, {
        url: downloadUrl,
        filename: answer,
      })
    })
    return attachmentDownloadUrls
  }, [data?.responses])

  const { downloadAttachmentsAsZipMutation } = useMutateDownloadAttachments()

  const handleDownload = useCallback(() => {
    if (attachmentDownloadUrls.size === 0 || !secretKey) return
    return downloadAttachmentsAsZipMutation.mutate({
      attachmentDownloadUrls,
      secretKey,
      fileName: `RefNo ${submissionId}.zip`,
    })
  }, [
    attachmentDownloadUrls,
    downloadAttachmentsAsZipMutation,
    secretKey,
    submissionId,
  ])

  if (!secretKey) return <SecretKeyVerification />

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
              Respondent
              {currentRespondentNumber ? ` #${currentRespondentNumber}` : ''}
            </Text>
          </Skeleton>
          <ButtonGroup>
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
              Response ID:
            </Text>
            &nbsp;{submissionId}
          </Text>
          <Box display="inline-flex">
            <Text as="span" textStyle="subhead-1">
              Timestamp:
            </Text>
            <Skeleton isLoaded={!isLoading && !isError}>
              &nbsp;{data?.submissionTime ?? 'Loading...'}
            </Skeleton>
          </Box>
          {attachmentDownloadUrls.size > 0 && (
            <Box alignItems="center" display="inline-flex">
              <Text as="span" textStyle="subhead-1">
                Attachments:
              </Text>
              <Skeleton isLoaded={!isLoading && !isError}>
                &nbsp;
                <Button
                  variant="link"
                  isDisabled={downloadAttachmentsAsZipMutation.isLoading}
                  onClick={handleDownload}
                  rightIcon={
                    downloadAttachmentsAsZipMutation.isLoading ? (
                      <Spinner fontSize="1.5rem" />
                    ) : (
                      <BiDownload fontSize="1.5rem" />
                    )
                  }
                >
                  {simplur`Download ${attachmentDownloadUrls.size} attachment[|s] as .zip`}
                </Button>
              </Skeleton>
            </Box>
          )}
        </Stack>
        <Stack>
          {isLoading || isError ? (
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

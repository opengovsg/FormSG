import { useCallback, useState } from 'react'
import { UseMutationResult } from 'react-query'
import { useParams } from 'react-router-dom'
import {
  Box,
  ButtonGroup,
  Container,
  Flex,
  Grid,
  Icon,
  Text,
} from '@chakra-ui/react'
import {
  Button,
  ButtonProps,
  Pagination,
  TouchableTooltip,
} from '@opengovsg/design-system-react'
import simplur from 'simplur'

import { ProcessedFeedbackMeta, ProcessedIssueMeta } from '~shared/types'

import { BxsInfoCircle } from '~assets/icons'
import { useIsMobile } from '~hooks/useIsMobile'

import {
  DownloadFormFeedbackMutationArgs,
  DownloadFormIssuesMutationArgs,
  useFormFeedbackMutations,
  useFormIssueMutations,
} from '~features/admin-form/common/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'

import { useFormFeedback, useFormIssues } from '../queries'

import { ISSUE_TABLE_COLUMNS } from './issue/IssueTable'
import { REVIEW_TABLE_COLUMNS } from './review/ReviewTable'
import { EmptyFeedback } from './EmptyFeedback'
import { FeedbackDownloadButton } from './FeedbackDownloadButton'
import {
  FeedbackPageSkeleton,
  FeedbackPageSkeletonMobile,
} from './FeedbackSkeleton'
import { FeedbackTable } from './FeedbackTable'

enum FeedbackType {
  Issues = 'issues',
  Reviews = 'reviews',
}

interface Feedback {
  count: number | undefined
  isGetLoading: boolean
}

interface Issue extends Feedback {
  data: ProcessedIssueMeta[] | undefined
  download: UseMutationResult<void, Error, DownloadFormIssuesMutationArgs>
}

interface Review extends Feedback {
  data: ProcessedFeedbackMeta[] | undefined
  average: string | undefined
  download: UseMutationResult<void, Error, DownloadFormFeedbackMutationArgs>
}

export const FeedbackPage = (): JSX.Element => {
  // Extract form information
  const { data: form } = useAdminForm()
  const { formId } = useParams()

  // Meta for feedback page
  const isMobile = useIsMobile()
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [currentFeedbackType, setCurrentFeedbackType] = useState<FeedbackType>(
    FeedbackType.Issues,
  )

  // Hooks for form reviews
  const { data: reviewData, isLoading: isReviewLoading } = useFormFeedback()
  const reviewDownload = useFormFeedbackMutations().downloadFormFeedbackMutation
  const reviewProps: Review = {
    count: reviewData?.count,
    data: reviewData?.feedback,
    average: reviewData?.average,
    download: reviewDownload,
    isGetLoading: isReviewLoading,
  }

  // Hooks for form issues
  const { data: issueData, isLoading: isIssueLoading } = useFormIssues()
  const issueDownload = useFormIssueMutations().downloadFormIssueMutation
  const issueProps: Issue = {
    count: issueData?.count,
    data: issueData?.issues,
    download: issueDownload,
    isGetLoading: isIssueLoading,
  }

  // Download button handler
  const handleFeedbackDownloadClick = useCallback(() => {
    if (!formId || !form?.title) return
    if (currentFeedbackType === FeedbackType.Issues) {
      return issueProps.download.mutate({
        formId,
        formTitle: form.title,
        count: issueProps.count,
      })
    }
    return reviewProps.download.mutate({
      formId,
      formTitle: form.title,
    })
  }, [
    currentFeedbackType,
    issueProps.count,
    issueProps.download,
    reviewProps.download,
    formId,
    form?.title,
  ])

  // Handle page loading state
  if (isPageLoading(currentFeedbackType, issueProps, reviewProps)) {
    return isMobile ? <FeedbackPageSkeletonMobile /> : <FeedbackPageSkeleton />
  }

  // Handle page empty state
  if (issueProps.count === 0 && reviewProps.count === 0) {
    return <EmptyFeedback />
  }

  return (
    <Container
      overflowY="auto"
      p="1.5rem"
      maxW="69.5rem"
      flex={1}
      display="flex"
      flexDir="column"
    >
      <Grid
        mb="1rem"
        minH={{ md: '4rem' }}
        alignItems="end"
        color="brand.secondary.500"
        gridTemplateColumns={{ base: 'auto', md: '1fr auto auto' }}
        gridGap={{ base: '0.5rem', md: '1.5rem' }}
        gridTemplateAreas={{
          base: "'information information' 'feedbackType export'",
          md: "'information feedbackType export'",
        }}
      >
        <Box gridArea="information" pl="0rem">
          {getInformationGridComponent(
            currentFeedbackType,
            issueProps,
            reviewProps,
          )}
        </Box>
        <ButtonGroup gridArea="feedbackType" isAttached variant="outline">
          <Button
            {...getFeedbackTypeButtonProps(
              currentFeedbackType,
              FeedbackType.Issues,
            )}
            sx={{ borderRightWidth: '0px' }}
            onClick={() => setCurrentFeedbackType(FeedbackType.Issues)}
          >
            Issues
          </Button>
          <Button
            {...getFeedbackTypeButtonProps(
              currentFeedbackType,
              FeedbackType.Reviews,
            )}
            onClick={() => setCurrentFeedbackType(FeedbackType.Reviews)}
          >
            Reviews
          </Button>
        </ButtonGroup>
        <Box gridArea="export" justifySelf="flex-end">
          <FeedbackDownloadButton
            {...getFeedBackDownloadButtonProps(
              currentFeedbackType,
              issueProps,
              reviewProps,
            )}
            handleClick={handleFeedbackDownloadClick}
            isMobile={isMobile}
          />
        </Box>
      </Grid>
      <Box mb="3rem" overflow="auto" flex={1}>
        <FeedbackTable
          feedbackData={
            currentFeedbackType === FeedbackType.Issues
              ? issueProps.data
              : reviewProps.data
          }
          feedbackColumns={
            currentFeedbackType === FeedbackType.Issues
              ? ISSUE_TABLE_COLUMNS
              : REVIEW_TABLE_COLUMNS
          }
          currentPage={currentPage - 1}
        />
      </Box>
      <Box
        display={getDisplayTableProp(
          currentFeedbackType,
          issueProps,
          reviewProps,
        )}
      >
        <Pagination
          totalCount={
            currentFeedbackType === FeedbackType.Issues
              ? issueProps.count ?? 0
              : reviewProps.count ?? 0
          }
          currentPage={currentPage} //1-indexed
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </Box>
    </Container>
  )
}

const getReviewInformationComponent = (
  average: string | undefined,
  count: number | undefined,
): JSX.Element => {
  return (
    <Grid
      gridTemplateColumns={{ base: 'auto', md: 'auto 1fr' }}
      gridGap={{ base: '0.5rem', md: '1.5rem' }}
      gridTemplateAreas={{
        base: "'submissions' 'score'",
        md: "'score submissions'",
      }}
    >
      <Flex gridArea="score" flexDir="column">
        <Text textStyle="caption-2" color="brand.secondary.400">
          Average Score
        </Text>
        <Text textStyle="responsive-heading-heavy">
          {average ? Number(average).toPrecision(2) : '-.--'}
        </Text>
      </Flex>
      <Box gridArea="submissions" alignSelf="end">
        <Text textStyle="h4" mb="0.5rem">
          <Text as="span" color="brand.primary.500">
            {count}
          </Text>
          {simplur` ${[count || 0]}review[|s] to date`}
        </Text>
      </Box>
    </Grid>
  )
}

const getIssueInformationComponent = (
  count: number | undefined,
): JSX.Element => {
  return (
    <Box display="flex" alignItems="center" mb="0.5rem">
      <Text textStyle="h4">
        <Text as="span" color="brand.primary.500">
          {count}
        </Text>
        {simplur` ${[count || 0]}issue[|s] to date`}
      </Text>
      <TouchableTooltip
        label={`Feedback displayed here relates to form submission issues`}
        placement="top"
        textAlign="center"
      >
        <Icon as={BxsInfoCircle} aria-hidden marginX="0.5rem" />
      </TouchableTooltip>
    </Box>
  )
}

const getInformationGridComponent = (
  currentFeedbackType: FeedbackType,
  issueProps: Issue,
  reviewProps: Review,
): JSX.Element => {
  if (currentFeedbackType === FeedbackType.Issues) {
    return getIssueInformationComponent(issueProps.count)
  }
  return getReviewInformationComponent(reviewProps.average, reviewProps.count)
}

const getFeedbackTypeButtonProps = (
  selectedFeedbackType: FeedbackType,
  feedbackType: FeedbackType,
): ButtonProps => {
  return selectedFeedbackType === feedbackType
    ? {
        colorScheme: 'main',
        isActive: true,
      }
    : {
        colorScheme: 'sub',
        isActive: false,
      }
}

const getFeedBackDownloadButtonProps = (
  currentFeedbackType: FeedbackType,
  issueProps: Issue,
  reviewProps: Review,
): {
  isDisabled: boolean
  isLoading: boolean
} => {
  const isLoading = isPageLoading(currentFeedbackType, issueProps, reviewProps)
  if (currentFeedbackType === FeedbackType.Issues) {
    return {
      isDisabled:
        isLoading || issueProps.count === 0 || issueProps.download.isLoading,
      isLoading: isLoading,
    }
  }
  return {
    isDisabled:
      isLoading || reviewProps.count === 0 || reviewProps.download.isLoading,
    isLoading: isLoading,
  }
}

const isPageLoading = (
  currentFeedbackType: FeedbackType,
  issueProps: Issue,
  reviewProps: Review,
): boolean => {
  return currentFeedbackType === FeedbackType.Issues
    ? issueProps.isGetLoading
    : reviewProps.isGetLoading
}

const getDisplayTableProp = (
  currentFeedbackType: FeedbackType,
  issueProps: Issue,
  reviewProps: Review,
): string => {
  return isPageLoading(currentFeedbackType, issueProps, reviewProps) ||
    currentFeedbackType === FeedbackType.Issues
    ? issueProps.count === 0
      ? 'none'
      : ''
    : reviewProps.count === 0
      ? 'none'
      : ''
}

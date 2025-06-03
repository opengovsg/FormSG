import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

import { ProcessedFeedbackMeta, ProcessedIssueMeta } from '~shared/types'

import Pagination from '~/components/Pagination'

import { BxsInfoCircle } from '~assets/icons'
import { useIsMobile } from '~hooks/useIsMobile'
import Button, { ButtonProps } from '~components/Button'
import Tooltip from '~components/Tooltip'

import {
  DownloadFormFeedbackMutationArgs,
  DownloadFormIssuesMutationArgs,
  useFormFeedbackMutations,
  useFormIssueMutations,
} from '~features/admin-form/common/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'

import { useFormFeedback, useFormIssues } from '../queries'

import { useIssueTableColumns } from './issue/IssueTable'
import { useReviewTableColumns } from './review/ReviewTable'
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
  translations: IssueInformationTranslations
}

interface Review extends Feedback {
  data: ProcessedFeedbackMeta[] | undefined
  average: string | undefined
  download: UseMutationResult<void, Error, DownloadFormFeedbackMutationArgs>
  translations: ReviewInformationTranslations
}

interface ReviewInformationTranslations {
  averageScore: string
  reviewsToDate: string
}

interface IssueInformationTranslations {
  tooltip: string
  issuesToDate: string
}
interface FeedbackPageTranslations {
  issues: string
  reviews: string
  reviewInformation: ReviewInformationTranslations
  issueInformation: IssueInformationTranslations
  feedbackCsvGenerator: {
    date: string
    comment: string
    rating: string
  }
  issueCsvGenerator: {
    date: string
    issue: string
    email: string
  }
}

export const FeedbackPage = (): JSX.Element => {
  const { t } = useTranslation()
  const translations: FeedbackPageTranslations = t(
    'features.adminForm.feedback.feedbackPage',
    {
      returnObjects: true,
    },
  )
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
  const reviewDownload = useFormFeedbackMutations([
    translations.feedbackCsvGenerator.date,
    translations.feedbackCsvGenerator.comment,
    translations.feedbackCsvGenerator.rating,
  ]).downloadFormFeedbackMutation
  const reviewProps: Review = {
    count: reviewData?.count,
    data: reviewData?.feedback,
    average: reviewData?.average,
    download: reviewDownload,
    isGetLoading: isReviewLoading,
    translations: {
      averageScore: translations.reviewInformation.averageScore,
      reviewsToDate: t(
        'features.adminForm.feedback.feedbackPage.reviewInformation.reviewsToDate',
        { reviewCount: reviewData?.count ?? 0 },
      ),
    },
  }

  // Hooks for form issues
  const { data: issueData, isLoading: isIssueLoading } = useFormIssues()
  const issueDownload = useFormIssueMutations([
    translations.issueCsvGenerator.date,
    translations.issueCsvGenerator.issue,
    translations.issueCsvGenerator.email,
  ]).downloadFormIssueMutation
  const issueProps: Issue = {
    count: issueData?.count,
    data: issueData?.issues,
    download: issueDownload,
    isGetLoading: isIssueLoading,
    translations: {
      tooltip: translations.issueInformation.tooltip,
      issuesToDate: t(
        'features.adminForm.feedback.feedbackPage.issueInformation.issuesToDate',
        { issueCount: issueData?.count ?? 0 },
      ),
    },
  }

  // Table column hooks for issue and review tables
  const issueTableColumns = useIssueTableColumns()
  const reviewTableColumns = useReviewTableColumns()

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
        color="secondary.500"
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
            {translations.issues}
          </Button>
          <Button
            {...getFeedbackTypeButtonProps(
              currentFeedbackType,
              FeedbackType.Reviews,
            )}
            onClick={() => setCurrentFeedbackType(FeedbackType.Reviews)}
          >
            {translations.reviews}
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
              ? issueTableColumns
              : reviewTableColumns
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
  translations: ReviewInformationTranslations,
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
        <Text textStyle="caption-2" color="secondary.400">
          {translations.averageScore}
        </Text>
        <Text textStyle="display-2">
          {average ? Number(average).toPrecision(2) : '-.--'}
        </Text>
      </Flex>
      <Box gridArea="submissions" alignSelf="end">
        <Text textStyle="h4" mb="0.5rem">
          <Text as="span" color="primary.500">
            {count}
          </Text>{' '}
          {translations.reviewsToDate}
        </Text>
      </Box>
    </Grid>
  )
}

const getIssueInformationComponent = (
  count: number | undefined,
  translations: IssueInformationTranslations,
): JSX.Element => {
  return (
    <Box display="flex" alignItems="center" mb="0.5rem">
      <Text textStyle="h4">
        <Text as="span" color="primary.500">
          {count}
        </Text>{' '}
        {translations.issuesToDate}
      </Text>
      <Tooltip label={translations.tooltip} placement="top" textAlign="center">
        <Icon as={BxsInfoCircle} aria-hidden marginX="0.5rem" />
      </Tooltip>
    </Box>
  )
}

const getInformationGridComponent = (
  currentFeedbackType: FeedbackType,
  issueProps: Issue,
  reviewProps: Review,
): JSX.Element => {
  if (currentFeedbackType === FeedbackType.Issues) {
    return getIssueInformationComponent(
      issueProps.count,
      issueProps.translations,
    )
  }
  return getReviewInformationComponent(
    reviewProps.average,
    reviewProps.count,
    reviewProps.translations,
  )
}

const getFeedbackTypeButtonProps = (
  selectedFeedbackType: FeedbackType,
  feedbackType: FeedbackType,
): ButtonProps => {
  return selectedFeedbackType === feedbackType
    ? {
        colorScheme: 'primary',
        isActive: true,
      }
    : {
        colorScheme: 'secondary',
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

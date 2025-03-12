import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UseMutationResult } from 'react-query'
import { useParams } from 'react-router-dom'
import { Column } from 'react-table'
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
import { DateCell } from '~features/admin-form/responses/FeedbackPage/DateCell'

import { useFormFeedback, useFormIssues } from '../queries'

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

  const { t } = useTranslation()

  const issueTableColumns: Column[] = [
    {
      Header: '#',
      accessor: (_row, i) => i + 1,
      sortType: 'number',
      minWidth: 50, // minWidth is only used as a limit for resizing
      width: 50, // width is used for both the flex-basis and flex-grow
      maxWidth: 100, // maxWidth is only used as a limit for resizing
    },
    {
      Header: t('features.common.date'),
      accessor: 'timestamp',
      sortType: 'number',
      Cell: DateCell,
      minWidth: 80, // minWidth is only used as a limit for resizing
      width: 80, // width is used for both the flex-basis and flex-grow
      maxWidth: 120, // maxWidth is only used as a limit for resizing
    },
    {
      Header: t(
        'features.adminForm.responses.feedbackPage.issue.tableColumns.issueHeader',
      ),
      accessor: 'issue',
      sortType: 'basic',
      minWidth: 200,
      width: 300,
      maxWidth: 600,
    },
    {
      Header: t(
        'features.adminForm.responses.feedbackPage.issue.tableColumns.contactHeader',
      ),
      accessor: 'email',
      sortType: 'basic',
      minWidth: 120,
      width: 120,
      maxWidth: 300,
    },
  ]
  const reviewTableColumns: Column[] = [
    {
      Header: '#',
      accessor: (_row, i) => i + 1,
      sortType: 'number',
      minWidth: 50, // minWidth is only used as a limit for resizing
      width: 50, // width is used for both the flex-basis and flex-grow
      maxWidth: 100, // maxWidth is only used as a limit for resizing
    },
    {
      Header: t('features.common.date'),
      accessor: 'timestamp',
      sortType: 'number',
      Cell: DateCell,
      minWidth: 80, // minWidth is only used as a limit for resizing
      width: 80, // width is used for both the flex-basis and flex-grow
      maxWidth: 120, // maxWidth is only used as a limit for resizing
    },
    {
      Header: t(
        'features.adminForm.responses.feedbackPage.review.tableColumns.feedbackHeader',
      ),
      accessor: 'comment',
      sortType: 'basic',
      minWidth: 200,
      width: 300,
      maxWidth: 600,
    },
    {
      Header: t(
        'features.adminForm.responses.feedbackPage.review.tableColumns.ratingHeader',
      ),
      accessor: 'rating',
      sortType: 'number',
      minWidth: 90,
      width: 90,
      disableResizing: true,
    },
  ]

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
          {currentFeedbackType === FeedbackType.Issues ? (
            <GetIssueInformationComponent count={issueProps.count} />
          ) : (
            <GetReviewInformationComponent
              average={reviewProps.average}
              count={reviewProps.count}
            />
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
            {t('features.adminForm.responses.feedbackPage.issuesButtonLabel')}
          </Button>
          <Button
            {...getFeedbackTypeButtonProps(
              currentFeedbackType,
              FeedbackType.Reviews,
            )}
            onClick={() => setCurrentFeedbackType(FeedbackType.Reviews)}
          >
            {t('features.adminForm.responses.feedbackPage.reviewsButtonLabel')}
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

function GetReviewInformationComponent(props: {
  average?: string
  count?: number
}): JSX.Element {
  const { t } = useTranslation()

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
          {t('features.adminForm.responses.feedbackPage.review.averageScore')}
        </Text>
        <Text textStyle="display-2">
          {props.average ? Number(props.average).toPrecision(2) : '-.--'}
        </Text>
      </Flex>
      <Box gridArea="submissions" alignSelf="end">
        <Text textStyle="h4" mb="0.5rem">
          <Text as="span" color="primary.500">
            {props.count}
          </Text>
          {t('features.adminForm.responses.feedbackPage.review.reviewsToDate')}
        </Text>
      </Box>
    </Grid>
  )
}

function GetIssueInformationComponent(props: { count?: number }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Box display="flex" alignItems="center" mb="0.5rem">
      <Text textStyle="h4">
        <Text as="span" color="primary.500">
          {props.count}
        </Text>
        {t('features.adminForm.responses.feedbackPage.issue.issuesToDate')}
      </Text>
      <Tooltip
        label={`Feedback displayed here relates to form submission issues`}
        placement="top"
        textAlign="center"
      >
        <Icon as={BxsInfoCircle} aria-hidden marginX="0.5rem" />
      </Tooltip>
    </Box>
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

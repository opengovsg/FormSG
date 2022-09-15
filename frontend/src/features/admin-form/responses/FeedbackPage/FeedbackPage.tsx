import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Container, Flex, Grid, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import Pagination from '~/components/Pagination'

import { useIsMobile } from '~hooks/useIsMobile'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useFormFeedback } from '../queries'

import { EmptyFeedback } from './EmptyFeedback'
import { FeedbackDownloadButton } from './FeedbackDownloadButton'
import {
  FeedbackPageSkeleton,
  FeedbackPageSkeletonMobile,
} from './FeedbackSkeleton'
import { FeedbackTable } from './FeedbackTable'

export const FeedbackPage = (): JSX.Element => {
  const { data: { average, count, feedback } = {}, isLoading } =
    useFormFeedback()
  const { data: form } = useAdminForm()

  const { formId } = useParams()
  const isMobile = useIsMobile()
  const [currentPage, setCurrentPage] = useState<number>(1)

  const prettifiedAverageScore = useMemo(
    () => (average ? Number(average).toPrecision(2) : '-.--'),
    [average],
  )

  const prettifiedFeedbackCount = useMemo(() => {
    if (!count) return
    return simplur` ${[count]}feedback submission[|s] to date`
  }, [count])

  if (isLoading) {
    return isMobile ? <FeedbackPageSkeletonMobile /> : <FeedbackPageSkeleton />
  }

  if (count === 0) {
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
        alignItems="end"
        color="secondary.500"
        gridTemplateColumns={{ base: 'auto', md: 'auto auto 1fr' }}
        gridGap={{ base: '0.5rem', md: '1.5rem' }}
        gridTemplateAreas={{
          base: "'submissions submissions' 'score export'",
          md: "'score submissions export'",
        }}
      >
        <Flex gridArea="score" flexDir="column">
          <Text textStyle="caption-2" color="secondary.400">
            Average Score
          </Text>
          <Text textStyle="display-2">{prettifiedAverageScore}</Text>
        </Flex>
        <Box gridArea="submissions">
          <Text textStyle="h4" mb="0.5rem">
            <Text as="span" color="primary.500">
              {count}
            </Text>
            {prettifiedFeedbackCount}
          </Text>
        </Box>
        <Box gridArea="export" justifySelf="flex-end">
          <FeedbackDownloadButton
            isDisabled={isLoading || count === 0}
            formId={formId}
            formTitle={form?.title}
          />
        </Box>
      </Grid>
      <Box mb="3rem" overflow="auto" flex={1}>
        <FeedbackTable feedbackData={feedback} currentPage={currentPage - 1} />
      </Box>
      <Box display={isLoading || count === 0 ? 'none' : ''}>
        <Pagination
          totalCount={count ?? 0}
          currentPage={currentPage} //1-indexed
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </Box>
    </Container>
  )
}

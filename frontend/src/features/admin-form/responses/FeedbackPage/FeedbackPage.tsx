import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Container, Flex, Stack, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import Pagination from '~/components/Pagination'

import { useIsMobile } from '~hooks/useIsMobile'

import { FeedbackDownloadButton } from './FeedbackDownloadButton'
import {
  FeedbackPageSkeleton,
  FeedbackPageSkeletonMobile,
} from './FeedbackSkeleton'
import { FeedbackTable } from './FeedbackTable'
import { useFormFeedback } from './queries'

export const FeedbackPage = (): JSX.Element => {
  const { data, isLoading } = useFormFeedback()
  const { formId } = useParams()
  const { average, count, feedback } = data || {}
  const averageScore = average ? Number(average) : undefined
  const totalCount = count || 0
  const [currentPage, setCurrentPage] = useState<number>(1)

  const isMobile = useIsMobile()

  const prettifiedFeedbackCount = useMemo(() => {
    if (!data) return
    return simplur` ${[data.count]}feedback submission[|s] to date`
  }, [data])

  if (isLoading) {
    return isMobile ? <FeedbackPageSkeletonMobile /> : <FeedbackPageSkeleton />
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
      <Stack
        mb={{ base: '1.25rem', md: '1rem' }}
        direction="row"
        justify="space-between"
        align="flex-end"
        color="secondary.500"
      >
        <Stack
          spacing={{ base: '0.5rem', md: '1.5rem' }}
          direction={{ base: 'column-reverse', md: 'row' }}
          align={{ base: 'flex-start', md: 'flex-end' }}
        >
          <Flex flexDir="column">
            <Text textStyle="caption-2" color="secondary.400">
              Average Score
            </Text>
            <Text textStyle="display-2">
              {averageScore ? averageScore.toPrecision(2) : '-.--'}
            </Text>
          </Flex>
          <Box>
            <Text textStyle="h4" mb="0.5rem">
              <Text as="span" color="primary.500">
                {data?.count}
              </Text>
              {prettifiedFeedbackCount}
            </Text>
          </Box>
        </Stack>
        <FeedbackDownloadButton
          isDisabled={isLoading || count === 0}
          formId={formId}
          feedback={feedback}
        />
      </Stack>
      <Box mb="2rem" overflow="auto" flex={1}>
        <FeedbackTable feedbackData={feedback} currentPage={currentPage - 1} />
      </Box>
      <Box display={isLoading || count === 0 ? 'none' : ''}>
        <Pagination
          totalCount={totalCount}
          currentPage={currentPage} //1-indexed
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </Box>
    </Container>
  )
}

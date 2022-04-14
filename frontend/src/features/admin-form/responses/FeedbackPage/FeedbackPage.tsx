import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Container, Text } from '@chakra-ui/react'

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

  if (isLoading) {
    return isMobile ? <FeedbackPageSkeletonMobile /> : <FeedbackPageSkeleton />
  }

  return (
    <Box overflowY="auto" pb="2rem">
      <Container maxW="69.5rem" mt="1.5rem">
        {isMobile ? (
          <Text
            textStyle="h4"
            fontWeight="medium"
            fontSize="1.125rem"
            lineHeight="1.5rem"
            color="secondary.500"
            mb="1rem"
          >
            <Text as="span" color="primary.500">
              {data?.count}
            </Text>
            &nbsp; feedback submission(s) to date
          </Text>
        ) : null}
        <Text textStyle="caption-1" fontWeight="400" textColor="secondary.400">
          Average Score
        </Text>
        <Box
          display="flex"
          flexDir="row"
          justifyContent="space-between"
          mb="1rem"
          alignItems="center"
        >
          <Box display="flex" justifyContent="flex-start" alignItems="center">
            <Box>
              <Text
                textStyle="display-2"
                fontWeight="semibold"
                fontSize="2.5rem"
                lineHeight="3rem"
                color="secondary.500"
                letterSpacing="-2.2%"
                mr="0.75rem"
              >
                {averageScore ? averageScore.toPrecision(2) : '-.--'}
              </Text>
            </Box>
            {isMobile ? null : (
              <Text
                textStyle="h4"
                fontWeight="medium"
                fontSize="1.125rem"
                lineHeight="1.5rem"
                color="secondary.500"
                ml="2rem"
                display={isMobile ? 'None' : ''}
              >
                <Text as="span" color="primary.500">
                  {data?.count}
                </Text>
                &nbsp; feedback submission(s) to date
              </Text>
            )}
          </Box>
          <FeedbackDownloadButton
            isDisabled={isLoading || count === 0}
            formId={formId}
            feedbackData={
              feedback
                ? feedback.map((entry) => {
                    return {
                      index: entry.index,
                      date: entry.date,
                      feedback: entry.comment,
                      rating: entry.rating,
                    }
                  })
                : ''
            }
          />
        </Box>
        <Box mb="2rem">
          <FeedbackTable
            feedbackData={feedback}
            currentPage={currentPage - 1}
          />
        </Box>
        <Box display={isLoading || count === 0 ? 'none' : ''}>
          <Pagination
            totalCount={totalCount}
            currentPage={currentPage} //1-indexed
            pageSize={9}
            onPageChange={setCurrentPage}
          />
        </Box>
      </Container>
    </Box>
  )
}

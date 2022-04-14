import { useState } from 'react'
import { BiDownload } from 'react-icons/bi'
import { Box, Container, Skeleton, Text } from '@chakra-ui/react'

import Pagination from '~/components/Pagination'

import Button from '~components/Button'

import { FeedbackTable } from './FeedbackTable'
import { useFormFeedback } from './queries'

const FeedbackPageSkeleton = (): JSX.Element => {
  return (
    <Container maxW="69.5rem" mt="1.5rem">
      <Skeleton w="4rem" h="0.75rem"></Skeleton>
      <Box
        display="flex"
        flexDir="row"
        justifyContent="space-between"
        mb="1rem"
      >
        <Box display="flex" justifyContent="flex-start" alignItems="flex-end">
          <Box>
            <Skeleton mr="0.75rem" w="4.5rem" h="2rem" mt="0.5rem" />
          </Box>
          <Skeleton ml="2rem" w="14rem" h="2rem" />
        </Box>
        <Skeleton w="6rem" h="2rem" />
      </Box>
      <Skeleton w="100%" h="10rem" />
    </Container>
  )
}

export const FeedbackPage = (): JSX.Element => {
  const { data, isLoading } = useFormFeedback()
  const { average, count, feedback } = data || {}
  const averageScore = average ? Number(average) : undefined
  const totalCount = count || 0
  const [currentPage, setCurrentPage] = useState<number>(1)

  return isLoading ? (
    <FeedbackPageSkeleton />
  ) : (
    <Container maxW="69.5rem" mt="1.5rem">
      <Text textStyle="caption-1" fontWeight="400" textColor="secondary.400">
        Average Score
      </Text>
      <Box
        display="flex"
        flexDir="row"
        justifyContent="space-between"
        mb="1rem"
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
          <Text
            textStyle="h4"
            fontWeight="medium"
            fontSize="1.125rem"
            lineHeight="1.5rem"
            color="secondary.500"
            ml="2rem"
          >
            <Text as="span" color="primary.500">
              {data?.count}
            </Text>
            &nbsp; feedback submission(s) to date
          </Text>
        </Box>
        <Button leftIcon={<BiDownload />}>Export </Button>
      </Box>
      <Box mb="2rem">
        <FeedbackTable feedbackData={feedback} currentPage={currentPage - 1} />
      </Box>
      <Pagination
        totalCount={totalCount}
        currentPage={currentPage} //1-indexed
        pageSize={9}
        onPageChange={setCurrentPage}
      ></Pagination>
    </Container>
  )
}

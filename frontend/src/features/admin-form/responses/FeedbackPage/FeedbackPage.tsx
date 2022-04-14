import { Box, chakra, Container, Text } from '@chakra-ui/react'

import { getSmileyFromScore } from './FeedbackService'
import { useFormFeedback } from './queries'

export const FeedbackPage = (): JSX.Element => {
  const { data, isLoading } = useFormFeedback()
  console.log('data is')
  console.log(data)

  const averageScore = Number(data?.average)
  console.log('xx')
  console.log(averageScore)
  console.log()

  return (
    <Container maxW="69.5rem" mt="1.5rem">
      <Text textStyle="caption-1" fontWeight="400" textColor="secondary.400">
        Average Score
      </Text>
      <Box display="flex" flexDir="row" justifyContent="space-between">
        <Box display="flex" justifyContent="flex-start">
          <Text
            textStyle="display-2"
            fontWeight="semibold"
            fontSize="2.5rem"
            lineHeight="3rem"
            color="secondary.500"
            letterSpacing="-2.2%"
            mr="0.75rem"
          >
            {data?.average}
          </Text>
          {chakra(getSmileyFromScore(averageScore))}
        </Box>
        <Box>B</Box>
      </Box>
      <>{isLoading ? 'Loading' : 'Finished'}</>
    </Container>
  )
}

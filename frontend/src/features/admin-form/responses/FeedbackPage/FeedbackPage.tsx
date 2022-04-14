import { BiDownload } from 'react-icons/bi'
import { Box, Container, Icon, Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { getSmileyFromScore } from './FeedbackService'
import { useFormFeedback } from './queries'

export const FeedbackPage = (): JSX.Element => {
  const { data, isLoading } = useFormFeedback()
  console.log('data is')
  console.log(data)

  const averageScore = data?.average ? Number(data?.average) : undefined

  console.log('xx')
  console.log(averageScore)
  console.log()

  return (
    <Container maxW="69.5rem" mt="1.5rem">
      <Text textStyle="caption-1" fontWeight="400" textColor="secondary.400">
        Average Score
      </Text>
      <Box display="flex" flexDir="row" justifyContent="space-between">
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
          <Icon
            as={getSmileyFromScore(averageScore)}
            h="2.5rem"
            w="2.5rem"
            mr="2.5rem"
            ml="0.75rem"
          />
          <Text
            textStyle="h4"
            fontWeight="medium"
            fontSize="1.125rem"
            lineHeight="1.5rem"
            color="secondary.500"
          >
            <Text as="span" color="primary.500">
              {data?.count}
            </Text>
            &nbsp; feedback submission(s) to date
          </Text>
        </Box>
        <Button leftIcon={<BiDownload />}>Export </Button>
      </Box>
      <>{isLoading ? 'Loading' : 'Finished'}</>
    </Container>
  )
}

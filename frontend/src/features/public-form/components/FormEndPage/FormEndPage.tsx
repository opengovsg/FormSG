import { Container, Flex, Stack, StackDivider } from '@chakra-ui/react'

import { FormDto } from '~shared/types/form'

import { EndPageBlock } from './components/EndPageBlock'
import { FeedbackBlock, FeedbackFormInput } from './components/FeedbackBlock'
import { ThankYouSvgr } from './components/ThankYouSvgr'

export interface FormEndPageProps {
  endPage: FormDto['endPage']
  submissionMeta: {
    formTitle: string
    submissionId: string
    timeInEpochMs: number
  }
  handleSubmitFeedback: (inputs: FeedbackFormInput) => void
  isFeedbackSubmitted: boolean
}

export const FormEndPage = ({
  handleSubmitFeedback,
  isFeedbackSubmitted,
  ...endPageProps
}: FormEndPageProps): JSX.Element => {
  return (
    <Container w="42.5rem" maxW="100%" p={0}>
      <Flex flexDir="column" align="center">
        <ThankYouSvgr maxW="100%" />
        <Stack
          spacing={{ base: '1.5rem', md: '3rem' }}
          py={{ base: '1.5rem', md: '3rem' }}
          px={{ base: '1.5rem', md: '4rem' }}
          bg="white"
          w="100%"
          divider={<StackDivider />}
        >
          <EndPageBlock {...endPageProps} />
          {isFeedbackSubmitted ? null : (
            <FeedbackBlock onSubmit={handleSubmitFeedback} />
          )}
        </Stack>
      </Flex>
    </Container>
  )
}

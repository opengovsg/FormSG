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
}

export const FormEndPage = ({
  handleSubmitFeedback,
  ...endPageProps
}: FormEndPageProps): JSX.Element => {
  return (
    <Container w="42.5rem" maxW="100%">
      <Flex flexDir="column" align="center">
        <ThankYouSvgr pt="2.5rem" />
        <Stack
          spacing="3rem"
          py="3rem"
          px="4rem"
          bg="white"
          w="100%"
          divider={<StackDivider />}
        >
          <EndPageBlock {...endPageProps} />
          <FeedbackBlock onSubmit={handleSubmitFeedback} />
        </Stack>
      </Flex>
    </Container>
  )
}

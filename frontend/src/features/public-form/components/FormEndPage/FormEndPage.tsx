import { Container, Flex, Stack, StackDivider } from '@chakra-ui/react'

import { FormColorTheme, FormDto } from '~shared/types/form'

import { SubmissionData } from '~features/public-form/PublicFormContext'

import { EndPageBlock } from './components/EndPageBlock'
import { FeedbackBlock, FeedbackFormInput } from './components/FeedbackBlock'
import { ThankYouSvgr } from './components/ThankYouSvgr'

export interface FormEndPageProps {
  formTitle: FormDto['title']
  endPage: FormDto['endPage']
  submissionData: SubmissionData
  handleSubmitFeedback: (inputs: FeedbackFormInput) => void
  isFeedbackSubmitted: boolean
  colorTheme: FormColorTheme
}

export const FormEndPage = ({
  handleSubmitFeedback,
  isFeedbackSubmitted,
  colorTheme,
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
          <EndPageBlock
            focusOnMount
            {...endPageProps}
            colorTheme={colorTheme}
          />
          {isFeedbackSubmitted ? null : (
            <FeedbackBlock
              colorTheme={colorTheme}
              onSubmit={handleSubmitFeedback}
            />
          )}
        </Stack>
      </Flex>
    </Container>
  )
}

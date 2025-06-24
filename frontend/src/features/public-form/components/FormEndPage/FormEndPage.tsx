import { Container, Flex, Stack, StackDivider } from '@chakra-ui/react'

import { FormColorTheme, FormDto, FormResponseMode } from '~shared/types/form'

import {
  SubmissionData,
  usePublicFormContext,
} from '~features/public-form/PublicFormContext'

import { EndPageBlock } from '../../../../components/FormEndPage/EndPageBlock'
import { ThankYouSvgr } from '../../../../components/FormEndPage/ThankYouSvgr'

import { FeedbackBlock, FeedbackFormInput } from './components/FeedbackBlock'
import { SubmitAnotherResponseButton } from './SubmitAnotherResponseButton'

export interface FormEndPageProps {
  formTitle: FormDto['title']
  endPage: FormDto['endPage']
  submissionData: SubmissionData
  handleSubmitFeedback: (inputs: FeedbackFormInput) => void
  isFeedbackSectionHidden: boolean
  colorTheme: FormColorTheme
}

export const FormEndPage = ({
  handleSubmitFeedback,
  isFeedbackSectionHidden,
  colorTheme,
  ...endPageProps
}: FormEndPageProps): JSX.Element => {
  const { form, previousSubmissionId } = usePublicFormContext()

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
            isButtonHidden={!!previousSubmissionId}
            form={form}
          />
          {isFeedbackSectionHidden ? null : (
            <FeedbackBlock
              colorTheme={colorTheme}
              onSubmit={handleSubmitFeedback}
              buttonVariant={previousSubmissionId ? 'solid' : 'outline'}
            />
          )}
          {form?.responseMode === FormResponseMode.Multirespondent &&
          form?.hasStatusTracker ? (
            <SubmitAnotherResponseButton
              endPage={endPageProps.endPage}
              colorTheme={colorTheme}
            />
          ) : null}
        </Stack>
      </Flex>
    </Container>
  )
}

import { useCallback, useState } from 'react'
import { BiCheck, BiCopy } from 'react-icons/bi'
import { Box, Container, Flex, Text, useClipboard } from '@chakra-ui/react'

import { useToast } from '~hooks/useToast'
import IconButton from '~components/IconButton'
import Input from '~components/Input'

import { usePublicFormMutations } from '~features/public-form/mutations'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FeedbackFormInput } from './components/FeedbackBlock'
import { ThankYouSvgr } from './components/ThankYouSvgr'
import { FormEndPage } from './FormEndPage'

export const FormEndPageContainer = (): JSX.Element | null => {
  const { form, formId, submissionId, submissionData, isPreview } =
    usePublicFormContext()
  const { submitFormFeedbackMutation } = usePublicFormMutations(
    formId,
    submissionData?.id ?? '',
  )
  const toast = useToast()
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false)

  /**
   * Handles feedback submission
   * @param isPreview whether form is in preview mode
   */
  const handleSubmitFeedback = useCallback(
    (inputs: FeedbackFormInput) => {
      // no mutation required in preview-form mode
      if (isPreview) {
        toast({
          description:
            'Thank you for submitting your feedback! Since you are in preview mode, the feedback is not stored.',
          status: 'success',
          isClosable: true,
        })
        setIsFeedbackSubmitted(true)
        return
      }
      // mutateAsync for react-hook-form to show correct loading state.
      else {
        return submitFormFeedbackMutation.mutateAsync(inputs, {
          onSuccess: () => {
            toast({
              description: 'Thank you for submitting your feedback!',
              status: 'success',
              isClosable: true,
            })
            setIsFeedbackSubmitted(true)
          },
        })
      }
    },
    [isPreview, submitFormFeedbackMutation, toast],
  )

  const { onCopy, hasCopied } = useClipboard(window.location.toString())

  if (!form || !submissionData) return null

  return (
    <Box py={{ base: '1.5rem', md: '2.5rem' }} w="100%">
      {submissionId ? (
        <Container w="42.5rem" maxW="100%" p={0}>
          <Flex flexDir="column" align="center">
            <ThankYouSvgr maxW="100%" />
            <Flex
              flexDir="column"
              py={{ base: '1.5rem', md: '3rem' }}
              px={{ base: '1.5rem', md: '4rem' }}
              bg="white"
              w="100%"
              gap="2rem"
            >
              <Flex flexDir="column" gap="1rem">
                <Text as="h2" textStyle="h2" textColor="secondary.500">
                  Thank you for filling out your part of the form.
                </Text>
                <Text>
                  Pass this link to the next respondent for them to complete
                  their part of the form.
                </Text>
              </Flex>
              <Flex gap="0.5rem">
                <Input
                  isDisabled={true}
                  value={window.location.toString()}
                  fontFamily="monospace"
                />
                <IconButton
                  icon={
                    hasCopied ? (
                      <BiCheck fontSize="1.5rem" />
                    ) : (
                      <BiCopy fontSize="1.5rem" />
                    )
                  }
                  aria-label="Copy link to be sent to the next respondent"
                  variant="outline"
                  onClick={onCopy}
                />
              </Flex>
            </Flex>
          </Flex>
        </Container>
      ) : (
        <FormEndPage
          colorTheme={form.startPage.colorTheme}
          submissionData={submissionData}
          formTitle={form.title}
          endPage={form.endPage}
          isFeedbackSubmitted={isFeedbackSubmitted}
          handleSubmitFeedback={handleSubmitFeedback}
        />
      )}
    </Box>
  )
}

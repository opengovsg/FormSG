// TODO #4279: Remove after React rollout is complete
import { KeyboardEventHandler, useCallback } from 'react'
import {
  Box,
  Flex,
  Text,
  useDisclosure,
  VisuallyHidden,
} from '@chakra-ui/react'

import { SwitchEnvFeedbackFormBodyDto } from '~shared/types'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { useEnvMutations } from '~features/env/mutations'
import { useSwitchEnvFeedbackFormView } from '~features/env/queries'
import { SwitchEnvFeedbackModal } from '~features/env/SwitchEnvFeedbackModal'

export const PublicSwitchEnvMessage = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleKeydown: KeyboardEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        onOpen()
        event.preventDefault()
      }
    },
    [onOpen],
  )

  // get the feedback form data
  const { data: feedbackForm } = useSwitchEnvFeedbackFormView(isOpen)

  const { submitSwitchEnvFormFeedbackMutation, publicSwitchEnvMutation } =
    useEnvMutations(feedbackForm)

  const submitFeedback = useCallback(
    (formInputs: SwitchEnvFeedbackFormBodyDto) => {
      return submitSwitchEnvFormFeedbackMutation.mutateAsync(formInputs)
    },
    [submitSwitchEnvFormFeedbackMutation],
  )

  return (
    <Flex justify="center">
      <Box w="100%" minW={0} h="fit-content" maxW="57rem">
        <InlineMessage
          variant="warning"
          mb="1.5rem"
          mt={{ base: '2rem', md: '0' }}
          id="switch-env-msg"
        >
          <Text>
            You’re using the new FormSG design. If you have trouble submitting,{' '}
            <Button
              tabIndex={0}
              p={0}
              as="u"
              variant="link"
              display="inline"
              my="-0.25rem"
              onClick={onOpen}
              onKeyDown={handleKeydown}
              aria-labelledby="switch-env-msg"
            >
              <VisuallyHidden>
                Click to switch to the original FormSG
              </VisuallyHidden>
              <Text as="span" display="inline" aria-hidden>
                switch to the original one here
              </Text>
            </Button>
            .
          </Text>
        </InlineMessage>
      </Box>
      <SwitchEnvFeedbackModal
        onSubmitFeedback={submitFeedback}
        onChangeEnv={publicSwitchEnvMutation.mutate}
        isOpen={isOpen}
        onClose={onClose}
      />
    </Flex>
  )
}

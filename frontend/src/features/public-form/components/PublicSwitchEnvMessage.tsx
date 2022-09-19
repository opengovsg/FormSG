// TODO #4279: Remove after React rollout is complete
import { Box, Flex, Text, useDisclosure } from '@chakra-ui/react'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { SwitchEnvFeedbackModal } from '~features/env/SwitchEnvFeedbackModal'

export const PublicSwitchEnvMessage = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <Flex justify="center">
      <Box w="100%" minW={0} h="fit-content" maxW="57rem">
        <InlineMessage
          variant="warning"
          mb="1.5rem"
          mt={{ base: '2rem', md: '0' }}
        >
          {/**
           * Hide the text and replicate it in the aria-label for the button instead,
           * because without it, the sentence will be read as two separate parts which
           * is confusing for those using screen readers.
           */}
          <Text>
            <Text as="span" aria-hidden display="inline">
              You’re using the new FormSG design. If you have trouble
              submitting,
            </Text>
            <Button
              variant="link"
              my="-0.25rem"
              onClick={onOpen}
              aria-label="You're using the new FormSG design. If you have trouble submitting, switch to the original one here."
            >
              <Text as="u">switch to the original one here.</Text>
            </Button>
          </Text>
        </InlineMessage>
      </Box>
      <SwitchEnvFeedbackModal isOpen={isOpen} onClose={onClose} />
    </Flex>
  )
}

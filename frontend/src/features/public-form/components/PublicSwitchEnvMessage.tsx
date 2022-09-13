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
          <Text>
            You’re using the new FormSG design. If you have trouble submitting,
            <Button variant="link" onClick={onOpen}>
              <Text as="u">switch to the original one here.</Text>
            </Button>
          </Text>
        </InlineMessage>
      </Box>
      <SwitchEnvFeedbackModal isOpen={isOpen} onClose={onClose} />
    </Flex>
  )
}

// TODO #4279: Remove after React rollout is complete
import { Text, useDisclosure } from '@chakra-ui/react'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { SwitchEnvFeedbackModal } from '~features/env/SwitchEnvFeedbackModal'

export const PublicSwitchEnvMessage = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <>
      <InlineMessage
        variant="warning"
        mb="1.5rem"
        mt={{ base: '2rem', md: '0' }}
      >
        <Text>
          You’re filling this form on the new FormSG. If you have trouble
          submitting,{' '}
          <Button
            variant="link"
            onClick={() => {
              onOpen()
            }}
          >
            <Text as="u">switch to the original one here.</Text>
          </Button>
        </Text>
      </InlineMessage>
      <SwitchEnvFeedbackModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}

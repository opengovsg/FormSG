// TODO #4279: Remove after React rollout is complete
import { Text, useDisclosure } from '@chakra-ui/react'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { useEnvMutations } from '~features/env/mutations'
import { SwitchEnvFeedbackModal } from '~features/env/SwitchEnvFeedbackModal'

export const AdminSwitchEnvMessage = (): JSX.Element => {
  const { adminSwitchEnvMutation } = useEnvMutations()
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <InlineMessage>
        <Text>
          Welcome to the new FormSG! You can still{' '}
          <Button
            variant="link"
            onClick={() => {
              // adminSwitchEnvMutation.mutate
              onOpen()
            }}
          >
            <Text as="u">switch to the original one,</Text>
          </Button>{' '}
          which is available until 28 May 2022.
        </Text>
      </InlineMessage>
      <SwitchEnvFeedbackModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}

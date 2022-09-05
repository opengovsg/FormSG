// TODO #4279: Remove after React rollout is complete
import { Text, useDisclosure } from '@chakra-ui/react'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { useEnv } from '~features/env/queries'
import { SwitchEnvFeedbackModal } from '~features/env/SwitchEnvFeedbackModal'

export const REMOVE_ADMIN_INFOBOX_THRESHOLD = 100

export const AdminSwitchEnvMessage = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { data: { angularPhaseOutDate, adminRollout } = {} } = useEnv()
  const showSwitchEnvMessage =
    adminRollout && adminRollout < REMOVE_ADMIN_INFOBOX_THRESHOLD
  return showSwitchEnvMessage ? (
    <>
      <InlineMessage>
        <Text>
          Welcome to the new FormSG! You can still
          <Button variant="link" onClick={onOpen}>
            <Text as="u">switch to the original one,</Text>
          </Button>
          which is available until {angularPhaseOutDate}.
        </Text>
      </InlineMessage>
      <SwitchEnvFeedbackModal isOpen={isOpen} onClose={onClose} />
    </>
  ) : (
    <></>
  )
}

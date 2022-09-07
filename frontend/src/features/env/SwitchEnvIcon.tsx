// TODO #4279: Remove after React rollout is complete
import { useMemo } from 'react'
import { BiMessage } from 'react-icons/bi'
import { Flex, Portal, useDisclosure } from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { REMOVE_ADMIN_INFOBOX_THRESHOLD } from '~features/workspace/components/AdminSwitchEnvMessage'

import { useEnv } from './queries'
import { SwitchEnvFeedbackModal } from './SwitchEnvFeedbackModal'

export const SwitchEnvIcon = (): JSX.Element | null => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { data: { adminRollout } = {} } = useEnv()
  const showSwitchEnvMessage = useMemo(
    () => adminRollout && adminRollout < REMOVE_ADMIN_INFOBOX_THRESHOLD,
    [adminRollout],
  )

  if (!showSwitchEnvMessage) return null

  return (
    <Portal>
      <Flex position="fixed" bottom="2.75rem" right="2.75rem" cursor="pointer">
        <Tooltip placement="left" label="Have feedback?">
          <IconButton
            variant="outline"
            as="a"
            aria-label="switch environments"
            icon={<BiMessage color="primary.500" />}
            onClick={onOpen}
          />
        </Tooltip>
        <SwitchEnvFeedbackModal isOpen={isOpen} onClose={onClose} />
      </Flex>
    </Portal>
  )
}

// TODO #4279: Remove after React rollout is complete
import { BiMessage } from 'react-icons/bi'
import { Flex, useDisclosure } from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { REMOVE_ADMIN_INFOBOX_THRESHOLD } from '~features/workspace/components/AdminSwitchEnvMessage'

import { useEnv } from './queries'
import { SwitchEnvFeedbackModal } from './SwitchEnvFeedbackModal'

export const SwitchEnvIcon = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { data: { adminRollout } = {} } = useEnv()
  const showSwitchEnvMessage =
    adminRollout && adminRollout < REMOVE_ADMIN_INFOBOX_THRESHOLD
  return showSwitchEnvMessage ? (
    <Flex
      position="fixed"
      bottom="2.75rem"
      right="2.75rem"
      zIndex="9999"
      cursor="pointer"
    >
      <Tooltip
        placement="left"
        label="Have feedback?"
        wrapperStyles={{ display: 'flex' }}
      >
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
  ) : (
    <></>
  )
}

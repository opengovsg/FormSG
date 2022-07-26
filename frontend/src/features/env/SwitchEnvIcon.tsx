// TODO #4279: Remove after React rollout is complete
import { BiMessage } from 'react-icons/bi'
import { Flex, useDisclosure } from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { SwitchEnvFeedbackModal } from './SwitchEnvFeedbackModal'

export const SwitchEnvIcon = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <Flex position="fixed" bottom="2.75rem" right="2.75rem" zIndex="9999">
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
  )
}

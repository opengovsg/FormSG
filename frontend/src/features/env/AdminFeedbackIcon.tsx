// TODO #4279: Remove after React rollout is complete
import { BiMessage } from 'react-icons/bi'
import { Flex, Portal, useDisclosure } from '@chakra-ui/react'

import { noPrintCss } from '~utils/noPrintCss'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { AdminFeedbackModal } from './AdminFeedbackModal'

export const AdminFeedbackIcon = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Portal>
      <Flex
        position="fixed"
        bottom="2.75rem"
        right="2.75rem"
        cursor="pointer"
        sx={noPrintCss}
      >
        <Tooltip placement="left" label="Have feedback?">
          <IconButton
            variant="outline"
            as="a"
            aria-label="switch environments"
            icon={<BiMessage color="primary.500" />}
            onClick={onOpen}
          />
        </Tooltip>
        <AdminFeedbackModal isOpen={isOpen} onClose={onClose} />
      </Flex>
    </Portal>
  )
}

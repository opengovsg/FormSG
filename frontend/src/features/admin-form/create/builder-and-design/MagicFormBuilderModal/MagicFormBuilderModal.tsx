import {
  Modal,
  ModalCloseButton,
  ModalContent,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

export type MagicFormBuilderModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
>

export const MagicFormBuilderModal = ({
  isOpen,
  onClose,
}: MagicFormBuilderModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        ABCD
      </ModalContent>
    </Modal>
  )
}

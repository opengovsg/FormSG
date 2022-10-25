import { useBreakpointValue } from '@chakra-ui/media-query'
import { Modal, ModalContent, UseDisclosureReturn } from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

import { CreateFormModalContent } from './CreateFormModalContent'
import { CreateFormWizardProvider } from './CreateFormWizardProvider'

export type CreateFormModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
>

export const CreateFormModal = ({
  isOpen,
  onClose,
}: CreateFormModalProps): JSX.Element => {
  const modalSize = useBreakpointValue(
    {
      base: 'mobile',
      xs: 'mobile',
      md: 'full',
    },
    { ssr: false },
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        {isOpen && (
          <CreateFormWizardProvider>
            <CreateFormModalContent />
          </CreateFormWizardProvider>
        )}
      </ModalContent>
    </Modal>
  )
}

import {
  Modal,
  ModalContent,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

import { CreateModalContent } from './CreateFormModalContent'
import { CreateFormWizardProvider } from './CreateFormWizardContext'

export type CreateFormModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
>

export const CreateFormModal = ({
  isOpen,
  onClose,
}: CreateFormModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        {isOpen && (
          <CreateFormWizardProvider>
            <CreateModalContent />
          </CreateFormWizardProvider>
        )}
      </ModalContent>
    </Modal>
  )
}

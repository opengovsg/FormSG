import {
  Modal,
  ModalContent,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

// Explicit import to avoid circular dependency warnings by rollup
import { CreateFormModalContent } from './CreateFormModalContent/CreateFormModalContent'
import { CreateFormWizardProvider } from './CreateFormWizardProvider'

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
            <CreateFormModalContent />
          </CreateFormWizardProvider>
        )}
      </ModalContent>
    </Modal>
  )
}

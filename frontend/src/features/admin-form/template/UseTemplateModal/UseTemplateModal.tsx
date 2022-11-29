import {
  Modal,
  ModalContent,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

import { CreateFormModalContent } from '~features/workspace/components/CreateFormModal/CreateFormModalContent'

import { UseTemplateWizardProvider } from './UseTemplateWizardProvider'

export type UseTemplateModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
> & { formId: string }

export const UseTemplateModal = ({
  formId,
  isOpen,
  onClose,
}: UseTemplateModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        <UseTemplateWizardProvider formId={formId}>
          <CreateFormModalContent />
        </UseTemplateWizardProvider>
      </ModalContent>
    </Modal>
  )
}

import {
  Modal,
  ModalContent,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

import { CreateFormModalContent } from '~features/workspace/components/CreateFormModal/CreateFormModalContent'

import { DupeFormTemplateWizardProvider } from './DupeFormTemplateWizardProvider'

export type DuplicateFormModalTemplateProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
> & { formId: string; isTemplate?: boolean }

export const DuplicateFormTemplateModal = ({
  formId,
  isTemplate,
  isOpen,
  onClose,
}: DuplicateFormModalTemplateProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        <DupeFormTemplateWizardProvider formId={formId} isTemplate={isTemplate}>
          <CreateFormModalContent />
        </DupeFormTemplateWizardProvider>
      </ModalContent>
    </Modal>
  )
}

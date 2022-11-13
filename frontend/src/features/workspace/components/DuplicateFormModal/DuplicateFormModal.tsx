import {
  Modal,
  ModalContent,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

import { CreateFormModalContent } from '../CreateFormModal/CreateFormModalContent'

import { DupeFormWizardProvider } from './DupeFormWizardProvider'

export type DuplicateFormModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
> & { formId: string; isTemplate?: boolean }

export const DuplicateFormModal = ({
  formId,
  isTemplate,
  isOpen,
  onClose,
}: DuplicateFormModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })
  console.log(isTemplate)
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        <DupeFormWizardProvider formId={formId} isTemplate={isTemplate}>
          <CreateFormModalContent />
        </DupeFormWizardProvider>
      </ModalContent>
    </Modal>
  )
}

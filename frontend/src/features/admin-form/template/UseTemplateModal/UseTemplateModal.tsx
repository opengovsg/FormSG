import {
  Modal,
  ModalContent,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

// Explicit import to avoid circular dependency warnings by rollup
import { CreateFormModalContent } from '~features/workspace/components/CreateFormModal/CreateFormModalContent/CreateFormModalContent'

import { UseTemplateWizardProvider } from './UseTemplateWizardProvider'

export type UseTemplateModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
> & { formId: string }

/**
 * Note: The word "Use" in "UseTemplateModal" is not referring to React's "use" convention for hooks.
 * "UseTemplate" is a FormSG functionality referring to the FormSG feature of utilising another form as a starting template.
 */
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

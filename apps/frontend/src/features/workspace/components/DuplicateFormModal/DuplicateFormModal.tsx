import { RemoveScroll } from 'react-remove-scroll'
import {
  Modal,
  ModalContent,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { FormId } from 'formsg-shared/types/form/form'

import { CreateFormModalContent } from '../CreateFormModal/CreateFormModalContent'
import { CreateFormFlowStates } from '../CreateFormModal/CreateFormWizardContext'

import { DupeFormWizardProvider } from './DupeFormWizardProvider'

export type DuplicateFormModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
> & {
  formIdToDuplicate: FormId | undefined
  workspaceId?: string
  /**
   * Step the duplicate wizard opens on. Defaults to the form details screen;
   * pass `StorageModeDetails` to open straight into the legacy setup.
   */
  initialStep?: CreateFormFlowStates
}

export const DuplicateFormModal = ({
  isOpen,
  onClose,
  formIdToDuplicate,
  workspaceId,
  initialStep,
}: DuplicateFormModalProps) => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      {/* HACK: Chakra isn't able to cleanly handle nested scroll locks https://github.com/chakra-ui/chakra-ui/issues/7723
          We'll override chakra's <RemoveScroll /> manually as react-remove-scroll give priority to the latest mounted instance
      */}
      <RemoveScroll>
        <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
          <DupeFormWizardProvider
            onClose={onClose}
            formIdToDuplicate={formIdToDuplicate}
            workspaceId={workspaceId}
            initialStep={initialStep}
          >
            <CreateFormModalContent />
          </DupeFormWizardProvider>
        </ModalContent>
      </RemoveScroll>
    </Modal>
  )
}

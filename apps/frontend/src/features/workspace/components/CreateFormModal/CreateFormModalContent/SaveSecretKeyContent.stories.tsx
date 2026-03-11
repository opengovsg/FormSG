import { UseFormRegister } from 'react-hook-form'
import { Modal, ModalContent } from '@chakra-ui/react'
import { Meta, StoryObj } from '@storybook/react'

import {
  SaveSecretKeyContent,
  SaveSecretKeyFormInput,
} from './SaveSecretKeyContent'

const meta: Meta<typeof SaveSecretKeyContent> = {
  title: 'Features/Workspace/CreateFormModal/SaveSecretKeyContent',
  component: (args) => (
    <Modal isOpen={true} onClose={() => {}}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <SaveSecretKeyContent {...args} />
      </ModalContent>
    </Modal>
  ),
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof SaveSecretKeyContent>

const mockSecretKey = 'mock_secret_key'
const mockFormTitle = 'Test Form'
const mockFormId = '12345'
const contentTitle = 'This is a mock title for the save your secret key modal'

export const Default: Story = {
  args: {
    contentTitle,
    secretKey: mockSecretKey,
    formTitle: mockFormTitle,
    formId: mockFormId,
    onClose: () => {},
    isFormStateValid: false,
    handleTrackEmail: () => {},
    onSubmitClick: () => {},
    registerStorageAck: ((name: keyof SaveSecretKeyFormInput) => ({
      onChange: async () => Promise.resolve(),
      onBlur: async () => Promise.resolve(),
      name,
      ref: () => {},
    })) as UseFormRegister<SaveSecretKeyFormInput>,
    isLoading: false,
  },
}

export const ReadyToSubmit: Story = {
  args: {
    ...Default.args,
    useSaveSecretKeyHook: () => ({
      isSubmitEnabled: true,
      hasCopiedKey: false,
      handleCopyKey: () => {},
      hasDownloadedKey: true,
      handleDownloadKey: () => {},
      mailToHref: `mailto:?subject=Secret Key for ${mockFormTitle}&body=Secret key for form "${mockFormTitle}" (${mockFormId}): ${mockSecretKey}`,
    }),
  },
}

export const Loading: Story = {
  args: {
    ...ReadyToSubmit.args,
    isLoading: true,
  },
}

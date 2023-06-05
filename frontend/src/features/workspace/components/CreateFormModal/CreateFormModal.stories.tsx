/* eslint-disable @typescript-eslint/no-unused-vars */
import { SyntheticEvent, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { MemoryRouter } from 'react-router-dom'
import {
  Modal,
  ModalContent,
  useClipboard,
  useDisclosure,
} from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { userHandlers } from '~/mocks/msw/handlers/user'

import { fullScreenDecorator, LoggedInDecorator } from '~utils/storybook'
import { ModalCloseButton } from '~components/Modal'

import { SaveSecretKeyScreen } from './CreateFormModalContent/SaveSecretKeyScreen'
import { CreateFormModal, CreateFormModalProps } from './CreateFormModal'
import { CreateFormWizardInputProps } from './CreateFormWizardContext'
import { CreateFormWizardProvider } from './CreateFormWizardProvider'

export default {
  title: 'Pages/WorkspacePage/CreateFormModal',
  component: CreateFormModal,
  decorators: [
    (storyFn) => <MemoryRouter>{storyFn()}</MemoryRouter>,
    fullScreenDecorator,
    LoggedInDecorator,
  ],
  parameters: {
    layout: 'fullscreen',
    // Prevent flaky tests due to modal animating in.
    chromatic: { pauseAnimationAtEnd: true },
    msw: userHandlers({ delay: 0 }),
  },
} as Meta

const Template: Story<CreateFormModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })

  return (
    <CreateFormModal
      {...args}
      {...modalProps}
      onClose={() => console.log('close modal')}
    />
  )
}
export const Default = Template.bind({})

export const StorageModeAckScreen = () => {
  const { register } = useForm<CreateFormWizardInputProps>()

  const secretKey = 'mock-secret-key'

  const { hasCopied: hasCopiedKey, onCopy } = useClipboard(secretKey)
  const handleCopyKey = useCallback(
    (e?: SyntheticEvent) => {
      e?.preventDefault()
      e?.stopPropagation()
      onCopy()
    },
    [onCopy],
  )

  const mockHook = useCallback(() => {
    return {
      isLoading: false,
      isSubmitEnabled: false,
      hasDownloaded: false,
      hasCopiedKey,
      handleCopyKey,
      handleDownloadKey: () => console.log('download key'),
      handleEmailKey: () => console.log('email key'),
      mailToHref: 'mailto:?subject=&body=',
      handleCreateStorageModeForm: () =>
        Promise.resolve(console.log('create storage mode form')),
      secretKey,
      register,
    }
  }, [handleCopyKey, hasCopiedKey, register])

  return (
    <Modal isOpen onClose={() => console.log('close modal')} size="full">
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        <CreateFormWizardProvider>
          <SaveSecretKeyScreen useSaveSecretKey={mockHook} />
        </CreateFormWizardProvider>
      </ModalContent>
    </Modal>
  )
}

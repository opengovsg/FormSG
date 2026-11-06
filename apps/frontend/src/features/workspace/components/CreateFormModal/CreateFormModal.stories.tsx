/* eslint-disable @typescript-eslint/no-unused-vars */
import { SyntheticEvent, useCallback } from 'react'
import { MemoryRouter } from 'react-router-dom'
import {
  Modal,
  ModalContent,
  useClipboard,
  useDisclosure,
} from '@chakra-ui/react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { featureFlags } from 'formsg-shared/constants'
import { UserId } from 'formsg-shared/types'
import { Workspace, WorkspaceId } from 'formsg-shared/types/workspace'

import { userHandlers } from '~/mocks/msw/handlers/user'

import { fullScreenDecorator, LoggedInDecorator } from '~utils/storybook'
import { ModalCloseButton } from '~components/Modal'

import { WorkspaceProvider } from '~features/workspace/WorkspaceProvider'

import { SaveSecretKeyScreen } from './CreateFormModalContent/SaveSecretKeyScreen'
import { CreateFormModal, CreateFormModalProps } from './CreateFormModal'
import { CreateFormWizardProvider } from './CreateFormWizardProvider'

const MOCK_DEFAULT_WORKSPACE = {
  _id: '' as WorkspaceId,
  title: 'All forms',
  formIds: [],
  admin: '' as UserId,
} as Workspace

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
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    msw: { handlers: { default: userHandlers({ delay: 0 }) } },
  },
} as Meta

const Template: StoryFn<CreateFormModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })

  return (
    <WorkspaceProvider
      currentWorkspace={MOCK_DEFAULT_WORKSPACE._id}
      defaultWorkspace={MOCK_DEFAULT_WORKSPACE}
      setCurrentWorkspace={() => {
        return
      }}
    >
      <CreateFormModal
        {...args}
        {...modalProps}
        onClose={() => console.log('close modal')}
      />
    </WorkspaceProvider>
  )
}
export const Default = Template.bind({})

const mrfCutoverOn = new GrowthBook({
  features: { [featureFlags.mrfCutover]: { defaultValue: true } },
})

export const MrfCutoverOn = Template.bind({})
MrfCutoverOn.decorators = [
  (Story) => (
    <GrowthBookProvider growthbook={mrfCutoverOn}>
      <Story />
    </GrowthBookProvider>
  ),
]

const mrfCutoverAndPaperTrackingOn = new GrowthBook({
  features: {
    [featureFlags.mrfCutover]: { defaultValue: true },
    [featureFlags.enablePaperTrackingSetUpPage]: { defaultValue: true },
  },
})

export const MrfCutoverAndPaperTrackingOn = Template.bind({})
MrfCutoverAndPaperTrackingOn.decorators = [
  (Story) => (
    <GrowthBookProvider growthbook={mrfCutoverAndPaperTrackingOn}>
      <Story />
    </GrowthBookProvider>
  ),
]

export const StorageModeAckScreen = () => {
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
      isSubmitEnabled: false,
      hasCopiedKey,
      handleCopyKey,
      hasDownloadedKey: false,
      handleDownloadKey: () => console.log('download key'),
      mailToHref: 'mailto:?subject=&body=',
    }
  }, [handleCopyKey, hasCopiedKey])

  return (
    <WorkspaceProvider
      currentWorkspace={MOCK_DEFAULT_WORKSPACE._id}
      defaultWorkspace={MOCK_DEFAULT_WORKSPACE}
      setCurrentWorkspace={() => {
        return
      }}
    >
      <Modal isOpen onClose={() => console.log('close modal')} size="full">
        <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
          <CreateFormWizardProvider onClose={() => console.log('close modal')}>
            <ModalCloseButton />
            <SaveSecretKeyScreen useSaveSecretKeyHook={mockHook} />
          </CreateFormWizardProvider>
        </ModalContent>
      </Modal>
    </WorkspaceProvider>
  )
}

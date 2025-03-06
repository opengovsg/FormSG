/* eslint-disable @typescript-eslint/no-unused-vars */
import { SyntheticEvent, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { UseQueryResult } from 'react-query'
import { MemoryRouter } from 'react-router-dom'
import {
  Modal,
  ModalContent,
  useClipboard,
  useDisclosure,
} from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { UserId } from '~shared/types'
import { PublicFormViewDto } from '~shared/types/form'
import { Workspace, WorkspaceId } from '~shared/types/workspace'

import { userHandlers } from '~/mocks/msw/handlers/user'

import { ApiError } from '~typings/core'

import { fullScreenDecorator, LoggedInDecorator } from '~utils/storybook'
import { ModalCloseButton } from '~components/Modal'

import { WorkspaceProvider } from '~features/workspace/WorkspaceProvider'

import {
  EmailModeCreationScreen,
  EmailModeFeedbackScreen,
} from './CreateFormModalContent/EmailModeFeedbackAndCreateScreen'
import { SaveSecretKeyScreen } from './CreateFormModalContent/SaveSecretKeyScreen'
import { CreateFormModal, CreateFormModalProps } from './CreateFormModal'
import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
  CreateFormWizardInputProps,
} from './CreateFormWizardContext'
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
    // Prevent flaky tests due to modal animating in.
    chromatic: { pauseAnimationAtEnd: true },
    msw: userHandlers({ delay: 0 }),
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
      handleDownloadAndNavigate: () => console.log('download and navigate'),
      handleCreateStorageModeForm: () =>
        Promise.resolve(console.log('create storage mode form')),
      secretKey,
      register,
      handleCreateStorageModeOrMultirespondentForm: () =>
        Promise.resolve(
          console.log('create storage mode or multirespondent form'),
        ),
    }
  }, [handleCopyKey, hasCopiedKey, register])

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
          <CreateFormWizardProvider>
            <ModalCloseButton />
            <SaveSecretKeyScreen useSaveSecretKey={mockHook} />
          </CreateFormWizardProvider>
        </ModalContent>
      </Modal>
    </WorkspaceProvider>
  )
}

export const EmailModeFeedback = () => {
  const formMethods = useForm<CreateFormWizardInputProps>()

  const mockHook = useCallback(
    () =>
      ({
        currentStep: CreateFormFlowStates.EmailFeedback,
        direction: 1,
        formMethods,
        handleDetailsSubmit: () => console.log('handle details submit'),
        handleEmailFeedbackSubmit: () => console.log('handle email feedback'),
        handleCreateEmailModeForm: () => () => console.log('create email form'),
        submitEmailModeFeedback: () => () => console.log('submit feedback'),
        handleCreateStorageModeOrMultirespondentForm: () =>
          Promise.resolve(console.log('create storage/multi form')),
        keypair: {
          publicKey: 'mock-public-key',
          privateKey: 'mock-private-key',
        },
        isFetching: false,
        isLoading: false,
        modalHeader: 'Email Mode Creation',
        isSingpass: false,
      }) as unknown as CreateFormWizardContextReturn,
    [formMethods],
  )

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
          <ModalCloseButton />
          <CreateFormWizardProvider>
            <EmailModeFeedbackScreen
              useCreateFormWizardParam={mockHook}
              useAdminUseEmailModeFormViewParam={() => {
                return {
                  data: {},
                } as unknown as UseQueryResult<PublicFormViewDto, ApiError>
              }}
            />
          </CreateFormWizardProvider>
        </ModalContent>
      </Modal>
    </WorkspaceProvider>
  )
}

export const EmailModeCreation = () => {
  const formMethods = useForm<CreateFormWizardInputProps>()

  const mockHook = useCallback(
    () =>
      ({
        currentStep: CreateFormFlowStates.EmailModeCreation,
        direction: 1,
        formMethods,
        handleDetailsSubmit: () => console.log('handle details submit'),
        handleEmailFeedbackSubmit: () => console.log('handle email feedback'),
        handleCreateEmailModeForm: () => () => console.log('create email form'),
        submitEmailModeFeedback: () => () => console.log('submit feedback'),
        handleCreateStorageModeOrMultirespondentForm: () =>
          Promise.resolve(console.log('create storage/multi form')),
        keypair: {
          publicKey: 'mock-public-key',
          privateKey: 'mock-private-key',
        },
        isFetching: false,
        isLoading: false,
        modalHeader: 'Email Mode Creation',
        isSingpass: false,
      }) as unknown as CreateFormWizardContextReturn,
    [formMethods],
  )

  return (
    <WorkspaceProvider
      currentWorkspace={MOCK_DEFAULT_WORKSPACE._id}
      defaultWorkspace={MOCK_DEFAULT_WORKSPACE}
      setCurrentWorkspace={() => {
        return
      }}
    >
      <Modal isOpen onClose={console.log} size="full">
        <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
          <ModalCloseButton />
          <CreateFormWizardProvider>
            <EmailModeCreationScreen
              useCreateFormWizardParam={mockHook}
              useAdminUseEmailModeFormViewParam={() => {
                return {
                  data: {},
                } as unknown as UseQueryResult<PublicFormViewDto, ApiError>
              }}
            />
          </CreateFormWizardProvider>
        </ModalContent>
      </Modal>
    </WorkspaceProvider>
  )
}

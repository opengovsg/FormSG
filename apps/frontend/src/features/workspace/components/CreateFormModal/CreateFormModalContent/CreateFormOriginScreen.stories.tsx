import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Modal, ModalContent } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react-vite'
import { expect, screen, userEvent } from 'storybook/test'

import { FormOrigin, FormResponseMode } from 'formsg-shared/types/form/form'

import { fullScreenDecorator } from '~utils/storybook'
import { ModalCloseButton } from '~components/Modal'

import {
  CreateFormWizardContextReturn,
  CreateFormWizardInputProps,
} from '../CreateFormWizardContext'

import { CreateFormOriginScreen } from './CreateFormOriginScreen'

export default {
  title: 'Pages/WorkspacePage/CreateFormModal/CreateFormOriginScreen',
  component: CreateFormOriginScreen,
  decorators: [fullScreenDecorator],
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
  },
} as Meta

const StoryOriginScreen = ({
  defaultValues,
}: {
  defaultValues?: Partial<CreateFormWizardInputProps>
}) => {
  const formMethods = useForm<CreateFormWizardInputProps>({
    defaultValues: {
      title: 'My form',
      responseMode: FormResponseMode.Multirespondent,
      ...defaultValues,
    },
  })

  const mockHook = useCallback(
    () =>
      ({
        formMethods,
        handleCreateStorageModeOrMultirespondentForm: formMethods.handleSubmit(
          () => console.log('create form'),
        ),
        goToFormDetails: () => console.log('back to details'),
        isLoading: false,
      }) as unknown as CreateFormWizardContextReturn,
    [formMethods],
  )

  return (
    <Modal isOpen onClose={() => console.log('close modal')} size="full">
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        <CreateFormOriginScreen useCreateFormWizardParam={mockHook} />
      </ModalContent>
    </Modal>
  )
}

const Template: StoryFn = () => <StoryOriginScreen />
export const Default = Template.bind({})

export const PaperSelected: StoryFn = () => (
  <StoryOriginScreen defaultValues={{ formOrigin: FormOrigin.Paper }} />
)

export const ValidationError: StoryFn = () => <StoryOriginScreen />
ValidationError.play = async () => {
  await userEvent.click(
    await screen.findByRole(
      'button',
      { name: /next step/i },
      { timeout: 3000 },
    ),
  )
  await expect(
    await screen.findByText('Please select an option.', undefined, {
      timeout: 3000,
    }),
  ).toBeInTheDocument()
}

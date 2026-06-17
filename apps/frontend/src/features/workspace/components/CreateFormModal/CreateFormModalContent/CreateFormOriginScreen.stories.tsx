import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Modal, ModalContent } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'

import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types/form/form'

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
    chromatic: { pauseAnimationAtEnd: true },
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

export const WithOtherSelected: StoryFn = () => (
  <StoryOriginScreen
    defaultValues={{ formOrigins: [CLIENT_CHECKBOX_OTHERS_INPUT_VALUE] }}
  />
)

export const ValidationError: StoryFn = () => <StoryOriginScreen />
ValidationError.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await userEvent.click(
    await canvas.findByRole('button', { name: /next step/i }),
  )
  await expect(
    await canvas.findByText('Please select at least 1 option.'),
  ).toBeInTheDocument()
}

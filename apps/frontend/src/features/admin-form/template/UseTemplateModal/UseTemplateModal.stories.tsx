import { MemoryRouter } from 'react-router-dom'
import { useDisclosure } from '@chakra-ui/react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react'

import { featureFlags } from 'formsg-shared/constants'

import { getTemplateFormResponse } from '~/mocks/msw/handlers/admin-form/template-form'
import { getUser, MOCK_USER, userHandlers } from '~/mocks/msw/handlers/user'

import { fullScreenDecorator, LoggedInDecorator } from '~utils/storybook'

import { UseTemplateModal, UseTemplateModalProps } from './UseTemplateModal'

const MOCK_SOURCE_FORM_ID = '61540ece3d4a6e50ac0cc6ff'

const baseMsw = [
  ...userHandlers({ delay: 0 }),
  getTemplateFormResponse({ delay: 0 }),
]

export default {
  title: 'Pages/AdminFormPage/UseTemplateModal',
  component: UseTemplateModal,
  decorators: [
    (storyFn) => <MemoryRouter>{storyFn()}</MemoryRouter>,
    fullScreenDecorator,
    LoggedInDecorator,
  ],
  parameters: {
    layout: 'fullscreen',
    chromatic: { pauseAnimationAtEnd: true },
    msw: baseMsw,
  },
} as Meta

const Template: StoryFn<UseTemplateModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })
  return (
    <UseTemplateModal
      {...args}
      {...modalProps}
      formId={MOCK_SOURCE_FORM_ID}
      onClose={() => console.log('close modal')}
    />
  )
}

export const Default = Template.bind({})

const mrfCutoverOn = new GrowthBook({
  features: { [featureFlags.mrfCutover]: { defaultValue: true } },
})

const withCutover = (Story: StoryFn) => (
  <GrowthBookProvider growthbook={mrfCutoverOn}>
    <Story />
  </GrowthBookProvider>
)

export const MrfCutoverOn = Template.bind({})
MrfCutoverOn.decorators = [withCutover]

export const MrfCutoverOnChildrenBeta = Template.bind({})
MrfCutoverOnChildrenBeta.decorators = [withCutover]
MrfCutoverOnChildrenBeta.parameters = {
  msw: [
    getUser({
      delay: 0,
      mockUser: { ...MOCK_USER, betaFlags: { children: true } },
    }),
    getTemplateFormResponse({ delay: 0 }),
  ],
}

export const MrfCutoverOnWebhookV1Beta = Template.bind({})
MrfCutoverOnWebhookV1Beta.decorators = [withCutover]
MrfCutoverOnWebhookV1Beta.parameters = {
  msw: [
    getUser({
      delay: 0,
      mockUser: {
        ...MOCK_USER,
        betaFlags: { createStorageModeForV1Webhook: true },
      },
    }),
    getTemplateFormResponse({ delay: 0 }),
  ],
}

export const MrfCutoverOnAllExceptions = Template.bind({})
MrfCutoverOnAllExceptions.decorators = [withCutover]
MrfCutoverOnAllExceptions.parameters = {
  msw: [
    getUser({
      delay: 0,
      mockUser: {
        ...MOCK_USER,
        betaFlags: {
          children: true,
          createStorageModeForV1Webhook: true,
        },
      },
    }),
    getTemplateFormResponse({ delay: 0 }),
  ],
}

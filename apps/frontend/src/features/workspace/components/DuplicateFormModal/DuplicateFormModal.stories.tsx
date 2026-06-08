import { MemoryRouter } from 'react-router-dom'
import { useDisclosure } from '@chakra-ui/react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react'
import { http, HttpResponse } from 'msw'

import { featureFlags } from 'formsg-shared/constants'
import { FormId } from 'formsg-shared/types/form/form'

import { getPreviewFormResponse } from '~/mocks/msw/handlers/admin-form/preview-form'
import { getUser, MOCK_USER, userHandlers } from '~/mocks/msw/handlers/user'

import { fullScreenDecorator, LoggedInDecorator } from '~utils/storybook'

import {
  DuplicateFormModal,
  DuplicateFormModalProps,
} from './DuplicateFormModal'

const getDashboardResponse = () =>
  http.get('/api/v3/admin/forms', () => HttpResponse.json([]))

const MOCK_SOURCE_FORM_ID = '61540ece3d4a6e50ac0cc6ff' as FormId

const baseMsw = [
  ...userHandlers({ delay: 0 }),
  getPreviewFormResponse({ delay: 0 }),
  getDashboardResponse(),
]

export default {
  title: 'Pages/WorkspacePage/DuplicateFormModal',
  component: DuplicateFormModal,
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

const Template: StoryFn<DuplicateFormModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })
  return (
    <DuplicateFormModal
      {...args}
      {...modalProps}
      formIdToDuplicate={MOCK_SOURCE_FORM_ID}
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
    getPreviewFormResponse({ delay: 0 }),
    getDashboardResponse(),
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
    getPreviewFormResponse({ delay: 0 }),
    getDashboardResponse(),
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
    getPreviewFormResponse({ delay: 0 }),
    getDashboardResponse(),
  ],
}

import { Meta, StoryFn } from '@storybook/react'

import { FormResponseMode, FormStatus } from 'formsg-shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { StoryRouter, viewports } from '~utils/storybook'

import { DeleteWorkflowModal } from './DeleteWorkflowModal'

/**
 * The modal has two states and they are not variants of each other: one asks
 * the admin to confirm something destructive, the other tells them they cannot
 * do it yet and points at the fix. Which one shows is decided by the form's
 * status, so the stories differ only in that.
 */
const buildMocks = (status: FormStatus) =>
  createFormBuilderMocks({
    responseMode: FormResponseMode.Multirespondent,
    status,
  })

export default {
  title: 'Features/AdminForm/Workflow/DeleteWorkflowModal',
  component: DeleteWorkflowModal,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    layout: 'fullscreen',
    chromatic: { pauseAnimationAtEnd: true, delay: 300 },
  },
} as Meta

const Template: StoryFn = () => (
  <DeleteWorkflowModal isOpen onClose={() => undefined} />
)

/** Form closed: deleting is allowed, and the confirm button is destructive. */
export const FormClosed = Template.bind({})
FormClosed.parameters = {
  msw: { handlers: { default: buildMocks(FormStatus.Private) } },
}

/**
 * Form open: the API refuses this, so the modal does not offer it. The primary
 * action goes to settings, which is the only place the admin can unblock
 * themselves.
 */
export const FormOpen = Template.bind({})
FormOpen.parameters = {
  msw: { handlers: { default: buildMocks(FormStatus.Public) } },
}

export const MobileFormClosed = Template.bind({})
MobileFormClosed.parameters = {
  ...FormClosed.parameters,
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const MobileFormOpen = Template.bind({})
MobileFormOpen.parameters = {
  ...FormOpen.parameters,
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

import { Meta, StoryFn } from '@storybook/react'

import {
  FormResponseMode,
  FormStatus,
  FormWorkflowStepDto,
  WorkflowType,
} from 'formsg-shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { StoryRouter, viewports } from '~utils/storybook'

import { useAdminForm } from '~features/admin-form/common/queries'

import { DeleteWorkflowModal } from './DeleteWorkflowModal'

const workflow_step_1: FormWorkflowStepDto = {
  _id: '61e6857c9c794b0012f1c6f8',
  workflow_type: WorkflowType.Static,
  emails: [],
  edit: [],
}

/**
 * `workflow` has to be set. The base mock form has no such key, and
 * `useWorkflowMutations` throws `No form workflow found` on a form without one,
 * which surfaces as the router's error page instead of the modal.
 */
const buildMocks = (status: FormStatus) =>
  createFormBuilderMocks({
    responseMode: FormResponseMode.Multirespondent,
    status,
    workflow: [workflow_step_1],
  })

/**
 * `useWorkflowMutations` throws while the form query is still in flight, so
 * mounting the modal directly errors on the first render, before MSW can
 * answer. `WorkflowContent` never hits that because it returns null until the
 * form has loaded; this mirrors that guard so the stories mount the modal the
 * way the app does.
 */
const AfterFormLoads = ({
  entryPoint,
}: {
  entryPoint: 'workflow-card' | 'first-step'
}) => {
  const { isLoading } = useAdminForm()
  if (isLoading) return null
  return (
    <DeleteWorkflowModal
      isOpen
      onClose={() => undefined}
      entryPoint={entryPoint}
    />
  )
}

/**
 * The modal has three states. Two of them are not variants of each other: one
 * asks the admin to confirm something destructive, the other tells them they
 * cannot do it yet and points at the fix. Which of those shows is decided by
 * the form's status.
 *
 * The third is the destructive state entered from step 1, which adds a line
 * explaining why deleting a step deleted the whole workflow. The form-open
 * state is deliberately shared across both entry points, so there is no
 * first-step variant of it to shoot.
 */
export default {
  title: 'Features/AdminForm/Workflow/DeleteWorkflowModal',
  component: DeleteWorkflowModal,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    layout: 'fullscreen',
    chromatic: { pauseAnimationAtEnd: true, delay: 300 },
  },
} as Meta

const Template: StoryFn = () => <AfterFormLoads entryPoint="workflow-card" />

const FirstStepTemplate: StoryFn = () => (
  <AfterFormLoads entryPoint="first-step" />
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

/**
 * Entered from step 1's delete button. Same outcome and same actions as
 * FormClosed, with a leading line explaining why a step delete removes the
 * workflow.
 */
export const FirstStepFormClosed = FirstStepTemplate.bind({})
FirstStepFormClosed.parameters = {
  msw: { handlers: { default: buildMocks(FormStatus.Private) } },
}

export const MobileFirstStepFormClosed = FirstStepTemplate.bind({})
MobileFirstStepFormClosed.parameters = {
  ...FirstStepFormClosed.parameters,
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

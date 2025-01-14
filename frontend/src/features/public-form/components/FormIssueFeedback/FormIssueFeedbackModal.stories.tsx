import { useDisclosure } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import {
  fullScreenDecorator,
  getMobileViewParameters,
  LoggedInDecorator,
  StoryRouter,
} from '~utils/storybook'

import {
  FormIssueFeedbackModal,
  FormIssueFeedbackProps,
} from './FormIssueFeedbackModal'

export default {
  title: 'Features/PublicForm/PreSubmissionFeedbackModal',
  component: FormIssueFeedbackModal,
  decorators: [
    fullScreenDecorator,
    LoggedInDecorator,
    StoryRouter({ initialEntries: ['/12345'], path: '/:formId' }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const Template: StoryFn<FormIssueFeedbackProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })

  return (
    <FormIssueFeedbackModal
      {...args}
      {...modalProps}
      onClose={() => console.log('close modal')}
    />
  )
}

export const PublicView = Template.bind({})
PublicView.args = {
  isPreview: false,
}
export const MobilePublicView = Template.bind({})
MobilePublicView.parameters = {
  ...getMobileViewParameters(),
}
MobilePublicView.args = {
  isPreview: false,
}

export const AdminPreview = Template.bind({})
AdminPreview.args = {
  isPreview: true,
}

export const MobileAdminPreView = Template.bind({})
MobileAdminPreView.parameters = {
  ...getMobileViewParameters(),
}
MobileAdminPreView.args = {
  isPreview: true,
}

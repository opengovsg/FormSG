import { useDisclosure } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react-vite'

import {
  fullScreenDecorator,
  LoggedInDecorator,
  StoryRouter,
  viewportModes,
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
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
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
PublicView.parameters = { argos: { modes: viewportModes('mobile') } }
PublicView.args = {
  isPreview: false,
  colorScheme: 'theme-red',
}

export const AdminPreview = Template.bind({})
AdminPreview.parameters = { argos: { modes: viewportModes('mobile') } }
AdminPreview.args = {
  isPreview: true,
  colorScheme: 'theme-red',
}

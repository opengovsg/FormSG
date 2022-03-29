import { Meta, Story } from '@storybook/react'

import { getMobileViewParameters } from '~utils/storybook'

import { FormEndPage, FormEndPageProps } from './FormEndPage'

export default {
  title: 'Pages/PublicFormPage/FormEndPage',
  component: FormEndPage,
  decorators: [],
  parameters: {
    backgrounds: {
      default: 'light',
    },
    layout: 'fullscreen',
  },
} as Meta<FormEndPageProps>

const Template: Story<FormEndPageProps> = (args) => <FormEndPage {...args} />
export const Default = Template.bind({})
Default.args = {
  endPage: {
    buttonText: 'Continue',
    title:
      'Thank you for your submission with some super long backstory about how important the submission is to them',
    paragraph: 'We will get back to you shortly.',
  },
  submissionMeta: {
    formTitle: 'Test Form',
    submissionId: 'mockSubmissionId',
    timeInEpochMs: 1648545566989,
  },
  handleSubmitFeedback: (inputs) => console.log(inputs),
}

export const FeedbackSubmitted = Template.bind({})
FeedbackSubmitted.args = {
  ...Default.args,
  isFeedbackSubmitted: true,
}

export const Mobile = Template.bind({})
Mobile.args = {
  ...Default.args,
}
Mobile.parameters = getMobileViewParameters()

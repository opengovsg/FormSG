import { Meta, Story } from '@storybook/react'

import { FormEndPage, FormEndPageProps } from './FormEndPage'

export default {
  title: 'Pages/PublicFormPage/FormEndPage',
  component: FormEndPage,
  decorators: [],
} as Meta

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
}

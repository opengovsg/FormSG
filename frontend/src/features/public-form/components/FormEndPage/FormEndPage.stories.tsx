import { Meta, Story } from '@storybook/react'

import { FormColorTheme } from '~shared/types'

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
    paragraph: 'We will get back to you shortly.\n\nOnce again,\r\nthank you.',
  },
  submissionData: {
    id: 'mockSubmissionId',
    timestamp: 1648545566989,
  },
  handleSubmitFeedback: (inputs) => console.log(inputs),
}

export const ColorThemeGreen = Template.bind({})
ColorThemeGreen.args = {
  ...Default.args,
  colorTheme: FormColorTheme.Green,
}

export const ColorThemeGrey = Template.bind({})
ColorThemeGrey.args = {
  ...Default.args,
  colorTheme: FormColorTheme.Grey,
}

export const ColorThemeBrown = Template.bind({})
ColorThemeBrown.args = {
  ...Default.args,
  colorTheme: FormColorTheme.Brown,
}

export const ColorThemeRed = Template.bind({})
ColorThemeRed.args = {
  ...Default.args,
  colorTheme: FormColorTheme.Red,
}

export const ColorThemeOrange = Template.bind({})
ColorThemeOrange.args = {
  ...Default.args,
  colorTheme: FormColorTheme.Orange,
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

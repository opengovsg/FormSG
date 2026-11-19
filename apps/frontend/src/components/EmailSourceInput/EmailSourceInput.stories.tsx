import { useState } from 'react'
import { BiMailSend, BiPlus, BiSelectMultiple } from 'react-icons/bi'
import { Meta, StoryFn } from '@storybook/react-vite'

import { getMobileViewGlobals } from '~utils/storybook'

import { EmailSources } from './emailSource'
import { EmailSourceInput, EmailSourceInputProps } from './EmailSourceInput'

export default {
  title: 'Components/EmailSourceInput',
  component: EmailSourceInput,
  decorators: [],
  parameters: {
    actions: { argTypesRegex: '^on.*' },
  },
  args: {
    name: 'email-source',
    fields: [
      {
        kind: 'emailField',
        fieldId: 'applicant',
        label: '1. Applicant email',
        icon: BiMailSend,
      },
      {
        kind: 'emailField',
        fieldId: 'manager',
        label: '2. Manager email',
        icon: BiMailSend,
      },
      {
        kind: 'dropdownField',
        fieldId: 'department',
        label: '3. Department',
        icon: BiSelectMultiple,
      },
    ],
    addFieldActions: {
      emailField: {
        label: 'Add an Email field',
        icon: BiPlus,
        onSelect: () => undefined,
      },
      dropdownField: {
        label: 'Add a Dropdown field',
        icon: BiPlus,
        onSelect: () => undefined,
      },
    },
  },
} as Meta<EmailSourceInputProps>

const NONE: EmailSources = { emails: [], emailFields: [], dropdownFields: [] }

const Template: StoryFn<EmailSourceInputProps> = ({ value, ...args }) => {
  const [source, setSource] = useState<EmailSources>(value)
  return <EmailSourceInput {...args} value={source} onChange={setSource} />
}

export const Empty = Template.bind({})
Empty.args = { value: NONE }

export const TypedEmails = Template.bind({})
TypedEmails.args = {
  value: { ...NONE, emails: ['jane@agency.gov.sg', 'bob@agency.gov.sg'] },
}

export const InvalidEmail = Template.bind({})
InvalidEmail.args = {
  value: { ...NONE, emails: ['jane@agency.gov.sg', 'bob@agency'] },
  isInvalid: true,
}

export const MixedSources = Template.bind({})
MixedSources.args = {
  value: {
    emails: ['jane@agency.gov.sg'],
    emailFields: ['manager'],
    dropdownFields: ['department'],
  },
}

export const DeletedField = Template.bind({})
DeletedField.args = {
  value: { ...NONE, dropdownFields: ['deleted'] },
  isInvalid: true,
}

export const Disabled = Template.bind({})
Disabled.args = { ...TypedEmails.args, isDisabled: true }

export const Mobile = Template.bind({})
Mobile.args = TypedEmails.args
Mobile.globals = getMobileViewGlobals()

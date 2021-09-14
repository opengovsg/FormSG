import { Meta } from '@storybook/react'

import * as stories from './IntlPhoneNumberInput.stories'
import { PhoneNumberInput } from './PhoneNumberInput'

export default {
  title: 'Components/PhoneNumberInput/SingleCountry',
  component: PhoneNumberInput,
  parameters: { actions: { argTypesRegex: '^on.*' } },
  decorators: [],
} as Meta

export const Default = stories.Default.bind({})
Default.args = {
  ...stories.Default.args,
  allowInternational: false,
}

export const Prefilled = stories.Prefilled.bind({})
Prefilled.args = {
  ...stories.Prefilled.args,
  allowInternational: false,
  defaultCountry: 'US',
}

export const Error = stories.Error.bind({})
Error.args = {
  ...stories.Error.args,
  allowInternational: false,
}

export const Success = stories.Success.bind({})
Success.args = {
  ...stories.Success.args,
  allowInternational: false,
}

export const Disabled = stories.Disabled.bind({})
Disabled.args = {
  ...stories.Disabled.args,
  allowInternational: false,
}

export const Playground = stories.Playground.bind({})
Playground.args = {
  ...stories.Playground.args,
  allowInternational: false,
}

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
  isAllowInternational: false,
}

export const Prefilled = stories.Prefilled.bind({})
Prefilled.args = {
  ...stories.Prefilled.args,
  isAllowInternational: false,
  defaultCountry: 'US',
}

export const Error = stories.Error.bind({})
Error.args = {
  ...stories.Error.args,
  isAllowInternational: false,
}

export const Success = stories.Success.bind({})
Success.args = {
  ...stories.Success.args,
  isAllowInternational: false,
}

export const Disabled = stories.Disabled.bind({})
Disabled.args = {
  ...stories.Disabled.args,
  isAllowInternational: false,
}

export const Playground = stories.Playground.bind({})
Playground.args = {
  ...stories.Playground.args,
  isAllowInternational: false,
}

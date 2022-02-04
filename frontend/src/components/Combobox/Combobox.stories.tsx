import { useArgs } from '@storybook/client-api'
import { Meta, Story } from '@storybook/react'

import { Combobox, ComboboxProps } from './Combobox'

export default {
  title: 'Components/Combobox',
  component: Combobox,
  decorators: [],
} as Meta

const Template: Story<ComboboxProps> = (args) => {
  const [{ value }, updateArgs] = useArgs()
  const onChange = (value: string) => updateArgs({ value })

  return <Combobox {...args} value={value} onChange={onChange} />
}
export const Default = Template.bind({})
Default.args = {
  items: [
    {
      value: 'A',
      label: 'A',
    },
    {
      value: 'B',
      label: 'B',
    },
    {
      value: 'Bat',
      label: 'Bat',
    },
    {
      value: 'C',
      label: 'C',
    },
    {
      value: 'D',
      label: 'D',
    },
  ],
  value: '',
}

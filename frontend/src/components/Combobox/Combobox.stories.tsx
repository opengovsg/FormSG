import { useArgs } from '@storybook/client-api'
import { Meta, Story } from '@storybook/react'

import { Combobox, ComboboxProps } from './Combobox'
import { ComboboxItem } from './types'
import { itemToLabelString } from './utils'

const INITIAL_COMBOBOX_ITEMS: ComboboxItem[] = [
  {
    value: 'A',
    label: 'A',
    description: 'Not to be confused with B',
  },
  {
    value: 'B',
    label: 'B',
    description: 'Not to be confused with A',
    disabled: true,
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
  {
    value: 'A1',
    label: 'A1',
  },
  {
    value: 'B2',
    label: 'B2',
  },
  {
    value: 'Bat3',
    label: 'Bat3',
  },
  {
    value: 'C4',
    label: 'C4',
  },
  {
    value: 'D5',
    label: 'D5',
    disabled: true,
  },
]

export default {
  title: 'Components/Combobox',
  component: Combobox,
  decorators: [],
  args: {
    items: INITIAL_COMBOBOX_ITEMS,
    value: '',
  },
} as Meta<ComboboxProps>

const Template: Story<ComboboxProps> = (args) => {
  const [{ value }, updateArgs] = useArgs()
  const onChange = (value: string) => updateArgs({ value })

  return <Combobox {...args} value={value} onChange={onChange} />
}
export const Default = Template.bind({})

export const NotClearable = Template.bind({})
NotClearable.args = {
  isClearable: false,
}

export const HasValueSelected = Template.bind({})
HasValueSelected.args = {
  value: itemToLabelString(INITIAL_COMBOBOX_ITEMS[0]),
  defaultIsOpen: true,
}

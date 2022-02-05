import { useArgs } from '@storybook/client-api'
import { Meta, Story } from '@storybook/react'

import { viewports } from '~utils/storybook'

import { ComboboxItem } from '../types'

import { MultiSelect, MultiSelectProps } from './MultiSelect'

const INITIAL_COMBOBOX_ITEMS: ComboboxItem[] = [
  {
    value: 'A',
    label: 'A',
  },
  {
    value: 'What happens when the label is fairly long',
    label: 'What happens when the label is fairly long',
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
  title: 'Components/MultiSelect',
  component: MultiSelect,
  decorators: [],
  args: {
    items: INITIAL_COMBOBOX_ITEMS,
    values: [],
  },
} as Meta<MultiSelectProps>

const Template: Story<MultiSelectProps> = (args) => {
  const [{ values }, updateArgs] = useArgs()
  const onChange = (value: string[]) => updateArgs({ value })

  return <MultiSelect {...args} values={values} onChange={onChange} />
}
export const Default = Template.bind({})

export const MobileTruncatedOption = Template.bind({})
MobileTruncatedOption.args = {}
MobileTruncatedOption.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

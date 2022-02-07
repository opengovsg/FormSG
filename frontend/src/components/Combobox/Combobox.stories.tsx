import { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { BiHeading, BiRadioCircleMarked } from 'react-icons/bi'
import { FormControl } from '@chakra-ui/react'
import { useArgs } from '@storybook/client-api'
import { Meta, Story } from '@storybook/react'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { Combobox, ComboboxProps } from './Combobox'
import { ComboboxItem } from './types'
import { itemToLabelString, itemToValue } from './utils'

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

export const WithIconSelected = Template.bind({})
WithIconSelected.args = {
  items: [
    {
      value: 'Radio button',
      icon: BiRadioCircleMarked,
      description: 'This is an option with an icon',
    },
    {
      value: 'Radio button button',
      icon: BiRadioCircleMarked,
      description: 'To show highlight effect between active and inactive',
    },
    {
      value: 'Section',
      icon: BiHeading,
      description: 'This is another option with an icon',
    },
  ],
  value: 'Radio button',
  defaultIsOpen: true,
}

export const Invalid = Template.bind({})
Invalid.args = {
  isInvalid: true,
}

export const Disabled = Template.bind({})
Disabled.args = {
  isDisabled: true,
}

export const Playground: Story<ComboboxProps> = ({ items }) => {
  const name = 'Dropdown'
  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm()

  const itemValues = useMemo(() => items.map((i) => itemToValue(i)), [items])

  const onSubmit = useCallback((data: unknown) => {
    alert(JSON.stringify(data))
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormControl isRequired isInvalid={!!errors[name]}>
        <FormLabel>Best fruit</FormLabel>
        <Controller
          control={control}
          name={name}
          rules={{
            required: 'Dropdown selection is required',
            validate: (value) => {
              return (
                itemValues.includes(value) ||
                'Entered value is not valid dropdown option'
              )
            },
          }}
          render={({ field }) => <Combobox items={items} {...field} />}
        />
        <FormErrorMessage>{errors[name]?.message}</FormErrorMessage>
      </FormControl>
      <Button type="submit">Submit</Button>
    </form>
  )
}

import { useCallback, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { BiRadioCircleMarked } from 'react-icons/bi'
import { FormControl } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'
import { get } from 'lodash'
import difference from 'lodash/difference'

import { fixedHeightDecorator, viewports } from '~utils/storybook'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { ComboboxItem } from '../types'
import { itemToValue } from '../utils/itemUtils'

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
    icon: BiRadioCircleMarked,
    description: 'With description',
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
  ...[...Array(2000).keys()].map(String),
]

export default {
  title: 'Components/MultiSelect',
  component: MultiSelect,
  decorators: [fixedHeightDecorator('300px')],
  args: {
    items: INITIAL_COMBOBOX_ITEMS,
    values: [],
  },
} as Meta<MultiSelectProps>

const Template: Story<MultiSelectProps> = ({ values: valuesProp, ...args }) => {
  const [values, setValues] = useState<string[]>(valuesProp)

  return <MultiSelect {...args} values={values} onChange={setValues} />
}
export const Default = Template.bind({})

export const WithDefaultInput = Template.bind({})
WithDefaultInput.args = {
  downshiftComboboxProps: {
    initialInputValue: 'What',
    defaultIsOpen: true,
  },
}

export const MobileTruncatedOption = Template.bind({})
MobileTruncatedOption.args = {
  values: ['What happens when the label is fairly long', 'Bat'],
  defaultIsOpen: true,
}
MobileTruncatedOption.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const Invalid = Template.bind({})
Invalid.args = {
  isInvalid: true,
}

export const Disabled = Template.bind({})
Disabled.args = {
  isDisabled: true,
}

export const DisabledWithSelection = Template.bind({})
DisabledWithSelection.args = {
  isDisabled: true,
  values: ['What happens when the label is fairly long', 'Bat'],
}

export const Playground: Story<MultiSelectProps> = ({ items, isDisabled }) => {
  const name = 'Multiselect'
  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: {
      [name]: [],
    },
  })

  const onSubmit = useCallback((data: unknown) => {
    alert(JSON.stringify(data))
  }, [])

  const itemValues = useMemo(() => items.map((i) => itemToValue(i)), [items])

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormControl isRequired isInvalid={!!errors[name]} id={name}>
        <FormLabel>Select all fruits you love</FormLabel>
        <Controller
          control={control}
          name={name}
          rules={{
            required: 'Please select at least one option',
            validate: (values) => {
              return (
                difference(values, itemValues).length === 0 ||
                'Some selected options do not exist in the dropdown options'
              )
            },
          }}
          render={({ field: { value, ...field } }) => (
            <MultiSelect
              values={value}
              items={items}
              {...field}
              isDisabled={isDisabled}
            />
          )}
        />
        <FormErrorMessage>{get(errors[name], 'message')}</FormErrorMessage>
      </FormControl>
      <Button type="submit">Submit</Button>
    </form>
  )
}

Playground.args = {
  isDisabled: false,
}

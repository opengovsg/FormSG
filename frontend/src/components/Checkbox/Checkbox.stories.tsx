import { useController, useForm } from 'react-hook-form'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Select,
} from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import Button from '~components/Button'

import { Checkbox, CheckboxProps } from './Checkbox'

export default {
  title: 'Components/Checkbox',
  component: Checkbox,
  decorators: [],
} as Meta

const Template: Story<CheckboxProps> = (args) => <Checkbox {...args} />
export const Default = Template.bind({})
Default.args = { options: ['Option 1', 'Option 2', 'Option 3'] }

export const OthersInput = Template.bind({})
OthersInput.args = {
  options: ['Option 1', 'Option 2', 'Option 3'],
  other: true,
}

export const OthersDropdown = Template.bind({})
OthersDropdown.args = {
  options: ['Option 1', 'Option 2', 'Option 3'],
  other: true,
  children: (
    <Select placeholder="Select option">
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
      <option value="option3">Option 3</option>
    </Select>
  ), // TODO: replace with custom dropdown component
}

export const Playground: Story = ({
  name,
  label,
  isDisabled,
  isRequired,
  ...args
}) => {
  const { handleSubmit, control } = useForm()
  const onSubmit = (data: unknown) => alert(JSON.stringify(data))
  const {
    field,
    formState: { errors },
  } = useController({
    control,
    name,
    rules: {
      required: isRequired ? { value: true, message: 'Required field' } : false,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormControl
        isRequired={isRequired}
        isDisabled={isDisabled}
        isInvalid={!!errors[name]}
        mb={6}
      >
        <FormLabel htmlFor={name}>{label}</FormLabel>
        <Checkbox
          {...args}
          options={['Option 1', 'Option 2', 'Option 3']}
          other={true}
          isDisabled={isDisabled}
          {...field}
        >
          <Input placeholder="Please specify"></Input>
        </Checkbox>
        <FormErrorMessage>
          {errors[name] && errors[name].message}
        </FormErrorMessage>
      </FormControl>
      <Button type="submit">Submit</Button>
    </form>
  )
}
Playground.args = {
  name: 'Test playground input',
  label: 'Checkbox Field',
  isRequired: false,
  isDisabled: false,
}

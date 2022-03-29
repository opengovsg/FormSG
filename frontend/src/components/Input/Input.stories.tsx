import { useForm } from 'react-hook-form'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
} from '@chakra-ui/form-control'
import { Meta, Story } from '@storybook/react'

import Button from '../Button'

import { Input, InputProps } from './Input'

export default {
  title: 'Components/Input',
  component: Input,
  decorators: [],
} as Meta

const Template: Story<InputProps> = (args) => <Input {...args} />
export const Default = Template.bind({})
Default.args = {
  placeholder: 'Test placeholder',
}

export const Prefilled = Template.bind({})
Prefilled.args = {
  placeholder: 'Test placeholder',
  defaultValue: 'Prefilled field',
  isPrefilled: true,
}

export const Error = Template.bind({})
Error.args = {
  isInvalid: true,
  placeholder: 'Test placeholder',
  defaultValue: 'Field error',
}

export const Success = Template.bind({})
Success.args = {
  isInvalid: false,
  isSuccess: true,
  placeholder: 'Test placeholder',
  defaultValue: 'Field success',
}
export const Disabled = Template.bind({})
Disabled.args = {
  defaultValue: 'Some text',
  placeholder: 'Test placeholder',
  isDisabled: true,
}

export const Playground: Story = ({
  name,
  label,
  isDisabled,
  isRequired,
  ...args
}) => {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm()
  const onSubmit = (data: unknown) => alert(JSON.stringify(data))

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormControl
        isRequired={isRequired}
        isDisabled={isDisabled}
        isInvalid={!!errors[name]}
        mb={6}
      >
        <FormLabel htmlFor={name}>{label}</FormLabel>
        <Input
          {...args}
          {...register(name, {
            required: isRequired
              ? { value: true, message: 'Required field' }
              : false,
          })}
        />
        <FormErrorMessage>
          {errors[name] && errors[name].message}
        </FormErrorMessage>
      </FormControl>
      <Button variant="solid" type="submit">
        Submit
      </Button>
    </form>
  )
}
Playground.args = {
  name: 'Test playground input',
  label: 'Field label',
  placeholder: 'Fill in this field',
  isRequired: true,
  isDisabled: false,
}

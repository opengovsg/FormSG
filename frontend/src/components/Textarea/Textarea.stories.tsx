import { useForm } from 'react-hook-form'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
} from '@chakra-ui/form-control'
import { Meta, Story } from '@storybook/react'

import Button from '../Button'

import { Textarea, TextareaProps } from './Textarea'

export default {
  title: 'Components/Textarea',
  component: Textarea,
  decorators: [],
} as Meta

const Template: Story<TextareaProps> = (args) => <Textarea {...args} />
export const Default = Template.bind({})
Default.args = {
  placeholder: 'Test placeholder',
}

export const Error = Template.bind({})
Error.args = {
  isInvalid: true,
  defaultValue: 'Field error',
}

export const Disabled = Template.bind({})
Disabled.args = {
  defaultValue: 'Some text',
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
        <Textarea
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
  name: 'Test playground Textarea',
  label: 'Field label',
  placeholder: 'Fill in this field',
  isRequired: true,
  isDisabled: false,
}

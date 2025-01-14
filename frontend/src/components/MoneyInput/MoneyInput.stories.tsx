import { Controller, useForm } from 'react-hook-form'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
} from '@chakra-ui/form-control'
import { Meta, StoryFn } from '@storybook/react'

import Button from '../Button'

import { MoneyInput, MoneyInputProps } from './MoneyInput'

export default {
  title: 'Components/MoneyInput',
  component: MoneyInput,
  decorators: [],
} as Meta

const Template: StoryFn<MoneyInputProps> = (args) => <MoneyInput {...args} />
export const Default = Template.bind({})
Default.args = {
  placeholder: 'Test placeholder',
}

export const Prefilled = Template.bind({})
Prefilled.args = {
  placeholder: 'Test placeholder',
  defaultValue: '3.142',
  isPrefilled: true,
}

export const Error = Template.bind({})
Error.args = {
  isInvalid: true,
}

// TODO: add error cases when e is involved (e.g. 2+e3489), once these cases are handled

export const Success = Template.bind({})
Success.args = {
  isInvalid: false,
  isSuccess: true,
}

export const Disabled = Template.bind({})
Disabled.args = {
  isDisabled: true,
}

export const Playground: StoryFn = ({
  name,
  label,
  isDisabled,
  isRequired,
  ...args
}) => {
  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm()
  const onSubmit = (data: unknown) => alert(JSON.stringify(data))

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormControl
        isRequired={isRequired}
        isDisabled={isDisabled}
        isInvalid={!!errors[name]}
        mb={6}
        id={name}
      >
        <FormLabel htmlFor={name}>{label}</FormLabel>
        <Controller
          name={name}
          control={control}
          rules={{
            required: isRequired
              ? { value: true, message: 'Required field' }
              : false,
          }}
          render={({ field }) => <MoneyInput {...field} {...args} />}
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

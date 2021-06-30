import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
} from '@chakra-ui/form-control'
import { Meta, Story } from '@storybook/react'
import { isValidPhoneNumber } from 'libphonenumber-js/mobile'

import Button from '../Button'

import { PhoneNumberInput, PhoneNumberInputProps } from './PhoneNumberInput'

export default {
  title: 'Components/PhoneNumberInput',
  component: PhoneNumberInput,
  parameters: { actions: { argTypesRegex: '^on.*' } },
  decorators: [],
} as Meta

const Template: Story<PhoneNumberInputProps> = (args) => {
  const [value, setValue] = useState<string | undefined>(args.value ?? '')
  return (
    <PhoneNumberInput
      {...args}
      value={value}
      onChange={(...params) => {
        args.onChange?.(...params)
        setValue(...params)
      }}
    />
  )
}
export const Default = Template.bind({})
Default.args = {
  placeholder: 'Enter number',
}

export const Prefilled = Template.bind({})
Prefilled.args = {
  placeholder: 'Enter number',
  value: '+6598765432',
  isPrefilled: true,
}

export const Error = Template.bind({})
Error.args = {
  isInvalid: true,
  placeholder: 'Enter number',
  value: '999',
}

export const Success = Template.bind({})
Success.args = {
  isInvalid: false,
  isSuccess: true,
  placeholder: 'Enter number',
  value: '+6598765432',
}
export const Disabled = Template.bind({})
Disabled.args = {
  value: '123',
  placeholder: 'Enter number',
  isDisabled: true,
}

export const Playground: Story = ({
  name,
  label,
  isDisabled,
  isRequired,
  defaultValue,
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
      >
        <FormLabel htmlFor={name}>{label}</FormLabel>
        <Controller
          control={control}
          name={name}
          defaultValue={defaultValue}
          rules={{
            required: isRequired
              ? { value: true, message: 'Required field' }
              : false,
            validate: (val) => isValidPhoneNumber(val) || 'Invalid number',
          }}
          render={({ field }) => <PhoneNumberInput {...args} {...field} />}
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
  placeholder: 'Enter number',
  isRequired: true,
  isDisabled: false,
  defaultValue: '98765432',
}

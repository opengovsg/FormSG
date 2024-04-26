import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
} from '@chakra-ui/form-control'
import { Meta, StoryFn } from '@storybook/react'
import { isValidPhoneNumber } from 'libphonenumber-js/mobile'

import Button from '../Button'

import { PhoneNumberInput, PhoneNumberInputProps } from './PhoneNumberInput'

export default {
  title: 'Components/PhoneNumberInput/International',
  component: PhoneNumberInput,
  parameters: { actions: { argTypesRegex: '^on.*' } },
  decorators: [],
} as Meta

const Template: StoryFn<PhoneNumberInputProps> = (args) => {
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
Default.args = {}

export const Prefilled = Template.bind({})
Prefilled.args = {
  value: '+12015550123',
  isPrefilled: true,
}

export const Error = Template.bind({})
Error.args = {
  isInvalid: true,
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
  isDisabled: true,
}

export const Playground: StoryFn = ({
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
            validate: (val) => {
              return isValidPhoneNumber(val) || 'Invalid number'
            },
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
  isRequired: true,
  isDisabled: false,
  defaultValue: '98765432',
}

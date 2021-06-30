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
  value: '123',
  placeholder: 'Enter number',
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
  placeholder: 'Fill in this field',
  isRequired: true,
  isDisabled: false,
  defaultValue: '98765432',
}

import { Controller, useForm } from 'react-hook-form'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
} from '@chakra-ui/form-control'
import { Meta, Story } from '@storybook/react'

import Button from '../Button'

import { MoneyInput, MoneyInputProps } from './MoneyInput'

export default {
  title: 'Components/MoneyInput',
  component: MoneyInput,
  decorators: [],
} as Meta

const Template: Story<MoneyInputProps> = (args) => <MoneyInput {...args} />
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

export const ErrorNegative = Template.bind({})
ErrorNegative.args = {
  isInvalid: true,
  defaultValue: '-1',
}

export const ErrorInvalid = Template.bind({})
ErrorInvalid.args = {
  isInvalid: true,
  defaultValue: '1+23',
}

// TODO: add error cases when e is involved (e.g. 2+e3489), once these cases are handled

export const SuccessInteger = Template.bind({})
SuccessInteger.args = {
  isInvalid: false,
  isSuccess: true,
  defaultValue: '1337',
}

export const SuccessEndWith1Dot = Template.bind({})
SuccessEndWith1Dot.args = {
  isInvalid: false,
  isSuccess: true,
  defaultValue: '439.',
}

export const SuccessFloatOneDp = Template.bind({})
SuccessFloatOneDp.args = {
  isInvalid: false,
  isSuccess: true,
  defaultValue: '42.3',
}

export const SuccessFloatTwoDp = Template.bind({})
SuccessFloatTwoDp.args = {
  isInvalid: false,
  isSuccess: true,
  defaultValue: '1.42',
}

export const SuccessFloatThreeDp = Template.bind({})
SuccessFloatThreeDp.args = {
  isInvalid: false,
  isSuccess: true,
  defaultValue: '923.498',
}

export const SuccessMultipleDots = Template.bind({})
SuccessMultipleDots.args = {
  isInvalid: false,
  isSuccess: true,
  defaultValue: '39.482.38',
}

export const Disabled = Template.bind({})
Disabled.args = {
  defaultValue: '0',
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

import { useCallback, useContext, useState } from 'react'
import { useController, useFieldArray, useForm } from 'react-hook-form'
import {
  CheckboxGroup,
  // Checkbox,
  CheckboxProps,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  forwardRef,
  Input,
  Text,
  useCheckbox,
  useCheckboxGroup,
  UseCheckboxGroupReturn,
  VStack,
} from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

// import CheckboxOthers from '~/components/Checkbox/CheckboxOthers'
import Button from '~components/Button'

import {
  Checkbox,
  CheckboxInput,
  CheckboxOthers,
  CheckboxWrapper,
  ComposableCheckbox,
  Others,
} from './Checkbox'

export default {
  title: 'Components/Checkbox',
  component: Checkbox,
  decorators: [],
} as Meta

export const TemplateGroup: Story<CheckboxProps> = (args) => {
  return (
    <VStack align="left">
      <Checkbox value="Option 1">Option 1</Checkbox>
      <Checkbox value="Option 1">Option 2</Checkbox>
      <Checkbox value="Option 1">Option 3</Checkbox>
    </VStack>
  )
}

export const TemplateGroupOthers: Story<CheckboxProps> = (args) => {
  return (
    <VStack align="left">
      <Checkbox value="Option 1">Option 1</Checkbox>
      <Checkbox value="Option 1">Option 2</Checkbox>
      <Checkbox value="Option 1">Option 3</Checkbox>
      {/* <CheckboxOthers placeholder="Please Specify" /> */}
    </VStack>
  )
}

// export const OthersInput = Template.bind({})
// OthersInput.args = {
//   options: ['Option 1', 'Option 2', 'Option 3'],
//   other: true,
// }

export const Playground: Story = ({
  name,
  label,
  isDisabled,
  isRequired,
  ...args
}) => {
  const { register, handleSubmit } = useForm()
  const onSubmit = (data: Record<string, string>) => {
    alert(JSON.stringify(data))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormControl isRequired={isRequired} isDisabled={isDisabled} mb={6}>
        <FormLabel htmlFor={name}>{label}</FormLabel>
        <VStack align="left">
          <CheckboxGroup isDisabled={isDisabled}>
            <Checkbox {...register('Option 1')} value="Option 1">
              Span 1
            </Checkbox>
            <Checkbox {...register('Option 2')} value="Option 2">
              Span 2
            </Checkbox>
            <Checkbox {...register('Option 3')} value="Option 3">
              Span 3
            </Checkbox>
            <Checkbox value="Others" {...register('Others')}>
              <CheckboxInput
                placeholder="Please specify"
                {...register('nested input')}
              />
            </Checkbox>
          </CheckboxGroup>
        </VStack>
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

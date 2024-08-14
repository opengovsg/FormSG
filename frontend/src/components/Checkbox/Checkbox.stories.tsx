import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormControl, VStack } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'
import { isEmpty } from 'lodash'

import { viewports } from '~utils/storybook'

import Button from '../Button'
import FormErrorMessage from '../FormControl/FormErrorMessage'
import FormLabel from '../FormControl/FormLabel'

import { Checkbox, CheckboxProps } from './Checkbox'

export default {
  title: 'Components/Checkbox',
  component: Checkbox,
} as Meta

const Template: Story<CheckboxProps> = (args) => {
  return <Checkbox {...args}>{args.name}</Checkbox>
}

export const Default = Template.bind({})
Default.args = {
  name: 'Default',
}

export const Mobile = Template.bind({})
Mobile.args = {
  name: 'Mobile',
}
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const Tablet = Template.bind({})
Tablet.args = {
  name: 'Tablet',
}
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}

const AllStates: Story<CheckboxProps> = (args) => {
  return (
    <VStack>
      <Checkbox {...args}>Unselected</Checkbox>
      <Checkbox {...args}>
        Really long unselected option that overflows and wraps to the next line
        because there is too much text. In fact, there's an entire paragraph so
        we can see what it looks like when there is too much text in the option.
      </Checkbox>
      <Checkbox {...args} isChecked>
        Selected
      </Checkbox>
      <Checkbox {...args} isDisabled>
        Unselected disabled
      </Checkbox>
      <Checkbox {...args} isChecked isDisabled>
        Selected disabled
      </Checkbox>
    </VStack>
  )
}

export const CheckboxStates = AllStates.bind({})

export const Playground: Story = ({
  name = 'checkbox',
  othersInputName = 'others-input',
  othersCheckboxName = 'others-checkbox',
  label,
  ...args
}) => {
  const options = useMemo(() => ['Option 1', 'Option 2', 'Option 3'], [])
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    control,
    trigger,
  } = useForm()
  const isOthersChecked = useWatch({
    name: othersCheckboxName,
    control,
  })
  useEffect(() => {
    // When isOthersChecked changes, manually trigger input validation. This
    // is to ensure that:
    // 1. if you check then uncheck the checkbox, the form knows
    // that the text input is now optional.
    // 2. if you check a non-others option, uncheck it, then check "Others",
    // the form knows that the error state should switch from "Please select
    // at least one option" to "Please specify others"
    // Use isDirty to avoid triggering validation when form first loads
    if (isDirty) {
      trigger(name)
      trigger(othersInputName)
    }
  }, [isOthersChecked, trigger, othersInputName, name, isDirty])
  const onSubmit = (data: unknown) => {
    alert(JSON.stringify(data))
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isInvalid={!isEmpty(errors)} mb={6}>
        <FormLabel isRequired>{label}</FormLabel>
        {options.map((o, idx) => (
          <Checkbox
            key={idx}
            value={o}
            {...register(name, {
              required: !isOthersChecked && 'This field is required',
            })}
            {...args}
          >
            {o}
          </Checkbox>
        ))}
        <Checkbox.OthersWrapper>
          <Checkbox.OthersCheckbox
            {...register(othersCheckboxName)}
            {...args}
          />
          <Checkbox.OthersInput
            {...register(othersInputName, {
              required: isOthersChecked && 'Please specify a value for Others',
            })}
          />
        </Checkbox.OthersWrapper>
        <FormErrorMessage>
          {errors[name]?.message ?? errors[othersInputName]?.message}
        </FormErrorMessage>
      </FormControl>
      <Button type="submit">Submit</Button>
    </form>
  )
}

Playground.args = {
  label: 'Checkbox label',
}

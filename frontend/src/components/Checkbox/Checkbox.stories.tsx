import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormControl, SimpleGrid, Text, VStack } from '@chakra-ui/react'
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

const AllCheckboxStates = (args: CheckboxProps) => {
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

const LabelledCheckboxStates = (args: CheckboxProps) => {
  return (
    <VStack
      align="left"
      border="1px dashed"
      borderColor={`${args.colorScheme}.300`}
      p="2rem"
    >
      <Text textStyle="h2">{args.colorScheme}</Text>
      <AllCheckboxStates {...args} />
    </VStack>
  )
}

const TemplateGroup: Story<CheckboxProps> = (args) => {
  return (
    <SimpleGrid columns={2} spacing={8} alignItems="center">
      <LabelledCheckboxStates {...args} colorScheme="primary" />
      <LabelledCheckboxStates {...args} colorScheme="theme-green" />
      <LabelledCheckboxStates {...args} colorScheme="theme-teal" />
      <LabelledCheckboxStates {...args} colorScheme="theme-purple" />
      <LabelledCheckboxStates {...args} colorScheme="theme-grey" />
      <LabelledCheckboxStates {...args} colorScheme="theme-yellow" />
      <LabelledCheckboxStates {...args} colorScheme="theme-orange" />
      <LabelledCheckboxStates {...args} colorScheme="theme-red" />
      <LabelledCheckboxStates {...args} colorScheme="theme-brown" />
    </SimpleGrid>
  )
}

export const CheckboxStates = TemplateGroup.bind({})
CheckboxStates.storyName = 'States and themes'

type PlaygroundFieldValues = {
  Checkbox: string[] | false
  Others: string
}

export const Playground: Story = ({
  name = 'checkbox',
  othersInputName = 'others-input',
  othersCheckboxName = 'others-checkbox',
  label,
  isDisabled,
  isRequired,
  ...args
}) => {
  const options = useMemo(() => ['Option 1', 'Option 2', 'Option 3'], [])
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    trigger,
  } = useForm()
  const isOthersChecked = useWatch({
    name: othersCheckboxName,
    control,
  })
  useEffect(() => {
    // When unchecking others, manually trigger input validation. This is
    // to ensure that if you check then uncheck the checkbox, the form knows
    // that the text input is now optional.
    if (!isOthersChecked) {
      trigger(othersInputName)
    }
  }, [isOthersChecked, trigger, othersInputName])
  const onSubmit = (data: PlaygroundFieldValues) => {
    alert(JSON.stringify(data))
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isInvalid={!isEmpty(errors)} mb={6}>
        <FormLabel isRequired>{label}</FormLabel>
        {options.map((o, idx) => (
          <Checkbox key={idx} value={o} {...register(name)} {...args}>
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
              required: isOthersChecked && 'Please specify Others',
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

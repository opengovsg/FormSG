import { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { FormControl, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'
import { isEmpty } from 'lodash'

import { viewports } from '~utils/storybook'

import Button from '../Button'
import FormErrorMessage from '../FormControl/FormErrorMessage'
import FormLabel from '../FormControl/FormLabel'

import { Radio, RadioGroupReturn, RadioProps } from './Radio'

export default {
  title: 'Components/Radio',
  component: Radio,
} as Meta

const Template: Story<RadioProps> = (args) => (
  <Radio {...args}>{args.name}</Radio>
)

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

const AllRadioStates = (args: RadioProps) => {
  return (
    <VStack>
      <Radio {...args}>Unselected</Radio>
      <Radio {...args}>
        Really long unselected option that overflows and wraps to the next line
        because there is too much text. In fact, there's an entire paragraph so
        we can see what it looks like when there is too much text in the option.
      </Radio>
      <Radio {...args} isChecked>
        Selected
      </Radio>
      <Radio {...args} isDisabled>
        Unselected disabled
      </Radio>
      <Radio {...args} isChecked isDisabled>
        Selected disabled
      </Radio>
    </VStack>
  )
}

const LabelledRadioStates = (args: RadioProps) => {
  return (
    <VStack
      align="left"
      border="1px dashed"
      borderColor={`${args.colorScheme}.300`}
      p="2rem"
    >
      <Text textStyle="h2">{args.colorScheme}</Text>
      <AllRadioStates {...args} />
    </VStack>
  )
}

const TemplateGroup: Story<RadioProps> = (args) => {
  return (
    <SimpleGrid columns={2} spacing={8} alignItems="center">
      <LabelledRadioStates {...args} colorScheme="primary" />
      <LabelledRadioStates {...args} colorScheme="theme-green" />
      <LabelledRadioStates {...args} colorScheme="theme-teal" />
      <LabelledRadioStates {...args} colorScheme="theme-purple" />
      <LabelledRadioStates {...args} colorScheme="theme-grey" />
      <LabelledRadioStates {...args} colorScheme="theme-yellow" />
      <LabelledRadioStates {...args} colorScheme="theme-orange" />
      <LabelledRadioStates {...args} colorScheme="theme-red" />
      <LabelledRadioStates {...args} colorScheme="theme-brown" />
    </SimpleGrid>
  )
}

export const RadioStates = TemplateGroup.bind({})
RadioStates.storyName = 'States and themes'

const PlaygroundTemplate: Story = ({
  name = 'radio',
  othersInputName = 'others-input',
  label,
  isDisabled,
  isRequired,
  hasOthers,
  ...args
}) => {
  const options = useMemo(() => ['Option 1', 'Option 2', 'Option 3'], [])
  const {
    handleSubmit,
    formState: { errors },
    control,
    trigger,
  } = useForm()
  const radioValue: RadioGroupReturn | undefined = useWatch({
    name,
    control,
  })
  useEffect(() => {
    // When unchecking others, manually trigger input validation. This is
    // to ensure that if you select then unselect Others, the form knows
    // that the text input is now optional.
    if (hasOthers && !radioValue?.isOthers) {
      trigger(othersInputName)
    }
  }, [hasOthers, radioValue, trigger, othersInputName])
  const onSubmit = (data: unknown) => {
    alert(JSON.stringify(data))
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isInvalid={!isEmpty(errors)} mb={6}>
        <FormLabel isRequired>{label}</FormLabel>
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Radio.RadioGroup {...field}>
              {options.map((o, idx) => (
                <Radio key={idx} value={o} {...args}>
                  {o}
                </Radio>
              ))}
              {hasOthers && <Radio.Others radioProps={args} />}
            </Radio.RadioGroup>
          )}
          rules={{
            required: 'Answer is required',
            validate: (ans: RadioGroupReturn) => {
              if (!ans.isOthers || !!ans.value) return true
              return 'Please specify Others'
            },
          }}
        />
        <FormErrorMessage>
          {errors[name]?.message ?? errors[othersInputName]?.message}
        </FormErrorMessage>
      </FormControl>
      <Button type="submit">Submit</Button>
    </form>
  )
}

export const Playground = PlaygroundTemplate.bind({})
Playground.args = {
  label: 'Radio without others',
  hasOthers: false,
}

export const PlaygroundWithOthers = PlaygroundTemplate.bind({})
PlaygroundWithOthers.args = {
  label: 'Radio with others',
  hasOthers: true,
}

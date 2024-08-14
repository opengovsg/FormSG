import { useMemo } from 'react'
import { FieldError, useForm } from 'react-hook-form'
import { FormControl, VStack } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'
import { get, isEmpty } from 'lodash'

import { viewports } from '~utils/storybook'

import Button from '../Button'
import FormErrorMessage from '../FormControl/FormErrorMessage'
import FormLabel from '../FormControl/FormLabel'

import { OthersInput, Radio, RadioProps } from './Radio'

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

const AllStates: Story<RadioProps> = (args) => {
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

export const RadioStates = AllStates.bind({})

const PlaygroundTemplate: Story = ({
  name = 'radio',
  othersInputName = 'others-input',
  label,
  isRequired,
  hasOthers,
  ...args
}) => {
  const options = useMemo(() => ['Option 1', 'Option 2', 'Option 3'], [])
  const {
    handleSubmit,
    formState: { errors },
    register,
    getValues,
  } = useForm()
  const othersInputError: FieldError | undefined = get(errors, othersInputName)

  const othersInputValue = '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

  const onSubmit = (data: unknown) => {
    alert(JSON.stringify(data))
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormControl isRequired={isRequired} isInvalid={!isEmpty(errors)} mb={6}>
        <FormLabel>{label}</FormLabel>
        <Radio.RadioGroup>
          {options.map((o, idx) => (
            <Radio
              key={idx}
              value={o}
              {...args}
              {...register(name, {
                required: {
                  value: isRequired,
                  message: 'This field is required',
                },
                deps: [othersInputName],
              })}
            >
              {o}
            </Radio>
          ))}
          {hasOthers && (
            <Radio.OthersWrapper
              {...register(name, {
                required: {
                  value: isRequired,
                  message: 'This field is required',
                },
                deps: [othersInputName],
              })}
              {...args}
              value={othersInputValue}
            >
              <FormControl
                isRequired={isRequired}
                isInvalid={!!othersInputError}
              >
                <OthersInput
                  aria-label="Enter others input"
                  {...register(othersInputName, {
                    validate: (value) => {
                      return (
                        getValues(name) !== othersInputValue ||
                        !!value ||
                        'Please specify a value for the "others" option'
                      )
                    },
                  })}
                />
              </FormControl>
            </Radio.OthersWrapper>
          )}
        </Radio.RadioGroup>
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
  isRequired: false,
}

export const PlaygroundWithOthers = PlaygroundTemplate.bind({})
PlaygroundWithOthers.args = {
  label: 'Radio with others',
  hasOthers: true,
  isRequired: true,
}

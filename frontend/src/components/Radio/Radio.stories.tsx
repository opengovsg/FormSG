import { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { FormControl, VStack } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'
import { isEmpty, omit } from 'lodash'

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
    register,
    trigger,
  } = useForm()
  const radioValue = useWatch({
    name,
    control,
  })

  const othersInputValue = '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

  useEffect(() => {
    // When unchecking others, manually trigger input validation. This is
    // to ensure that if you select then unselect Others, the form knows
    // that the text input is now optional.
    if (hasOthers && radioValue !== othersInputValue) {
      trigger(othersInputName)
    }
  }, [hasOthers, radioValue, trigger, othersInputName])

  const onSubmit = (data: unknown) => {
    alert(JSON.stringify(data))
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormControl isRequired={isRequired} isInvalid={!isEmpty(errors)} mb={6}>
        <FormLabel>{label}</FormLabel>
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            // Don't pass the ref to the surrounding div
            // so we don't have conflicting refs
            <Radio.RadioGroup {...omit(field, 'ref')}>
              {options.map((o, idx) => (
                <Radio key={idx} value={o} ref={field.ref} {...args}>
                  {o}
                </Radio>
              ))}
              {hasOthers && (
                <Radio.OthersWrapper
                  ref={field.ref}
                  {...args}
                  value={othersInputValue}
                >
                  <OthersInput
                    isInvalid={!!errors[othersInputName]}
                    {...register(othersInputName, {
                      validate: (value) => {
                        const isOthersSelected = radioValue === othersInputValue
                        if (isOthersSelected && !value) {
                          return 'Please specify a value for Others'
                        }
                        return true
                      },
                    })}
                  />
                </Radio.OthersWrapper>
              )}
            </Radio.RadioGroup>
          )}
          rules={{
            required: {
              value: isRequired,
              message: 'This field is required',
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
  isRequired: false,
}

export const PlaygroundWithOthers = PlaygroundTemplate.bind({})
PlaygroundWithOthers.args = {
  label: 'Radio with others',
  hasOthers: true,
  isRequired: true,
}

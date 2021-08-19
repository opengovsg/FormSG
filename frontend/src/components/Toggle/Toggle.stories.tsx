import { useForm } from 'react-hook-form'
import { VStack } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import Button from '../Button'

import { Toggle, ToggleProps } from './Toggle'

export default {
  component: Toggle,
  title: 'Components/Toggle',
} as Meta

const AllToggleStates: Story<ToggleProps> = (args) => {
  return (
    <VStack align="left" w="30%">
      <Toggle
        {...args}
        label="Selected"
        description="Some description"
        isChecked
      />
      <Toggle
        {...args}
        label="A really long label to demonstrate the minimum left margin of the toggle"
        description="The description is also really long for the same reason"
        isChecked
      />
      <Toggle
        {...args}
        label="Unselected"
        description="Some description"
        isChecked={false}
      />
      <Toggle
        {...args}
        label="Selected and disabled"
        description="Some description"
        isChecked
        isDisabled
      />
      <Toggle
        {...args}
        label="Unselected and disabled"
        description="Some description"
        isChecked={false}
        isDisabled
      />
    </VStack>
  )
}

export const ToggleStates = AllToggleStates.bind({})
ToggleStates.storyName = 'All states'

export const Playground: Story<ToggleProps> = (args) => {
  const labels = ['Toggle 1', 'Toggle 2', 'Toggle 3']
  const { register, handleSubmit } = useForm()
  const onSubmit = (data: unknown) => alert(JSON.stringify(data))
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack align="left" w="30%">
        {labels.map((l, idx) => (
          <Toggle
            key={idx}
            {...args}
            {...register(l)}
            label={l}
            description={`${l} description`}
          />
        ))}
      </VStack>
      <Button mt="1rem" type="submit">
        Submit
      </Button>
    </form>
  )
}

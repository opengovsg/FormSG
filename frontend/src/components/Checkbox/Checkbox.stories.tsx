import { SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { viewports } from '~utils/storybook'

import { Checkbox, CheckboxProps } from './Checkbox'

export default {
  title: 'Components/Checkbox',
  component: Checkbox,
} as Meta

const Template: Story<CheckboxProps> = (args) => <Checkbox {...args} />

export const Default = Template.bind({})
Default.args = {
  children: 'Default',
}

export const Mobile = Template.bind({})
Mobile.args = {
  children: 'Mobile',
}
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const Tablet = Template.bind({})
Tablet.args = {
  children: 'Tablet',
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

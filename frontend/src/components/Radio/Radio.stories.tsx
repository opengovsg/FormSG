import { SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { viewports } from '~utils/storybook'

import { Radio, RadioProps } from './Radio'

export default {
  title: 'Components/Radio',
  component: Radio,
} as Meta

const Template: Story<RadioProps> = (args) => <Radio {...args} />

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

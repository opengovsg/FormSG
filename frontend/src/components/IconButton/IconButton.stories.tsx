import { BiGitMerge } from 'react-icons/bi'
import { ButtonGroup, SimpleGrid, Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { IconButton, IconButtonProps } from './IconButton'

export default {
  title: 'Components/IconButton',
  component: IconButton,
  parameters: { backgrounds: { default: 'light' } },
} as Meta

const ButtonTemplate: Story<IconButtonProps> = (args) => (
  <IconButton {...args} />
)

const ButtonGroupTemplate: Story<IconButtonProps> = (args) => {
  return (
    <SimpleGrid
      columns={2}
      spacing={8}
      templateColumns="min-content auto"
      alignItems="center"
    >
      <Text>Default</Text>
      <ButtonGroup alignItems="center">
        <IconButton {...args} icon={<BiGitMerge />} size="lg" />
        <IconButton {...args} icon={<BiGitMerge />} size="md" />
      </ButtonGroup>
      <Text>Active</Text>
      <ButtonGroup alignItems="center">
        <IconButton {...args} icon={<BiGitMerge />} isActive size="lg" />
        <IconButton {...args} icon={<BiGitMerge />} isActive size="md" />
      </ButtonGroup>
      <Text>Disabled</Text>
      <ButtonGroup alignItems="center">
        <IconButton {...args} icon={<BiGitMerge />} isDisabled size="lg" />
        <IconButton {...args} icon={<BiGitMerge />} isDisabled size="md" />
      </ButtonGroup>
      <Text>Loading</Text>
      <ButtonGroup alignItems="center">
        <IconButton {...args} icon={<BiGitMerge />} isLoading size="lg" />
        <IconButton {...args} icon={<BiGitMerge />} isLoading size="md" />
      </ButtonGroup>
    </SimpleGrid>
  )
}

export const Default = ButtonTemplate.bind({})
Default.args = {
  'aria-label': 'Test Storybook Icon Button',
  icon: <BiGitMerge />,
  variant: 'solid',
  size: 'md',
}

export const SolidPrimary = ButtonGroupTemplate.bind({})
SolidPrimary.args = {
  'aria-label': 'Test Storybook Icon Button',
  variant: 'solid',
  colorScheme: 'primary',
}

export const OutlinePrimary = ButtonGroupTemplate.bind({})
OutlinePrimary.args = {
  'aria-label': 'Test Storybook Icon Button',
  variant: 'outline',
  colorScheme: 'primary',
}

export const ClearPrimary = ButtonGroupTemplate.bind({})
ClearPrimary.args = {
  'aria-label': 'Test Storybook Icon Button',
  variant: 'clear',
  colorScheme: 'primary',
}

export const ReverseSecondary = ButtonGroupTemplate.bind({})
ReverseSecondary.args = {
  'aria-label': 'Test Storybook Icon Button',
  variant: 'reverse',
  colorScheme: 'secondary',
}

export const OutlineSecondary = ButtonGroupTemplate.bind({})
OutlineSecondary.args = {
  'aria-label': 'Test Storybook Icon Button',
  variant: 'outline',
  colorScheme: 'secondary',
}

export const ClearSecondary = ButtonGroupTemplate.bind({})
ClearSecondary.args = {
  'aria-label': 'Test Storybook Icon Button',
  variant: 'clear',
  colorScheme: 'secondary',
}

export const SolidDanger = ButtonGroupTemplate.bind({})
SolidDanger.args = {
  'aria-label': 'Test Storybook Icon Button',
  variant: 'solid',
  colorScheme: 'danger',
}

export const OutlineDanger = ButtonGroupTemplate.bind({})
OutlineDanger.args = {
  'aria-label': 'Test Storybook Icon Button',
  variant: 'outline',
  colorScheme: 'danger',
}

export const ClearDanger = ButtonGroupTemplate.bind({})
ClearDanger.args = {
  'aria-label': 'Test Storybook Icon Button',
  variant: 'clear',
  colorScheme: 'danger',
}

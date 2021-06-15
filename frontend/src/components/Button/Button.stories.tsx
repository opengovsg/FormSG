import { BiRightArrowAlt, BiUpload } from 'react-icons/bi'
import { ButtonGroup, SimpleGrid, Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { Button, ButtonProps } from './Button'

export default {
  title: 'Components/Button',
  component: Button,
  parameters: { backgrounds: { default: 'light' } },
} as Meta

const ButtonTemplate: Story<ButtonProps> = (args) => <Button {...args} />

const ButtonGroupTemplate: Story = (args) => {
  return (
    <SimpleGrid
      columns={2}
      spacing={8}
      templateColumns="min-content auto"
      alignItems="center"
    >
      <Text>Default</Text>
      <ButtonGroup {...args}>
        <Button>Button</Button>
        <Button leftIcon={<BiUpload fontSize="1.5rem" />}>Leading</Button>
        <Button rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Active</Text>
      <ButtonGroup {...args}>
        <Button isActive>Button</Button>
        <Button isActive leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isActive rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Disabled</Text>
      <ButtonGroup {...args}>
        <Button isDisabled>Button</Button>
        <Button isDisabled leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isDisabled rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Loading</Text>
      <ButtonGroup {...args}>
        <Button isLoading>Button</Button>
        <Button
          isLoading
          leftIcon={<BiUpload fontSize="1.5rem" />}
          loadingText="Leading"
        ></Button>
        <Button
          isLoading
          rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
          loadingText="Trailing"
          spinnerPlacement="end"
        ></Button>
      </ButtonGroup>
    </SimpleGrid>
  )
}

export const Default = ButtonTemplate.bind({})
Default.args = {
  variant: 'primary',
  children: 'Button',
  colorScheme: 'primary',
}

export const FullWidth = ButtonTemplate.bind({})
FullWidth.args = {
  variant: 'primary',
  children: 'Button',
  isFullWidth: true,
}

export const Primary = ButtonGroupTemplate.bind({})
Primary.args = {
  variant: 'primary',
}

export const Danger = ButtonGroupTemplate.bind({})
Danger.args = {
  variant: 'danger',
}

export const Success = ButtonGroupTemplate.bind({})
Success.args = {
  variant: 'success',
}

export const Reverse = ButtonGroupTemplate.bind({})
Reverse.args = {
  variant: 'reverse',
  colorScheme: 'primary',
}

export const Outline = ButtonGroupTemplate.bind({})
Outline.args = {
  variant: 'outline',
  colorScheme: 'primary',
}

export const Clear = ButtonGroupTemplate.bind({})
Clear.args = {
  variant: 'clear',
  colorScheme: 'secondary',
}

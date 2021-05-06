import { ButtonGroup } from '@chakra-ui/button'
import { Stack } from '@chakra-ui/layout'
import { Meta, Story } from '@storybook/react'
import { BiRightArrowAlt, BiUpload } from 'react-icons/bi'

import { Button } from './Button'

//👇 We create a “template” of how args map to rendering
const Template: Story = (args) => (
  <Stack spacing="8">
    <ButtonGroup spacing="8">
      <Button {...args}>Primary</Button>
      <Button {...args} leftIcon={<BiUpload fontSize="24px" />}>
        Primary
      </Button>
      <Button {...args} rightIcon={<BiRightArrowAlt fontSize="24px" />}>
        Primary
      </Button>
    </ButtonGroup>
    <ButtonGroup spacing="8">
      <Button {...args} isDisabled>
        Disabled
      </Button>
      <Button {...args} isDisabled leftIcon={<BiUpload fontSize="24px" />}>
        Disabled
      </Button>
      <Button
        {...args}
        isDisabled
        rightIcon={<BiRightArrowAlt fontSize="24px" />}
      >
        Disabled
      </Button>
    </ButtonGroup>
    <ButtonGroup spacing="8">
      <Button {...args} isLoading />
      <Button {...args} isLoading loadingText="With Loading Text" />
    </ButtonGroup>
  </Stack>
)

export default {
  title: 'Components/Button',
  component: Button,
} as Meta

export const Primary = Template.bind({})
Primary.args = {
  variant: 'primary',
  children: 'Button',
}

export const Danger = Template.bind({})
Danger.args = {
  variant: 'danger',
  children: 'Button',
}

export const Success = Template.bind({})
Success.args = {
  variant: 'success',
  children: 'Button',
}

export const Reverse = Template.bind({})
Reverse.args = {
  variant: 'reverse',
  children: 'Button',
}

export const Outline = Template.bind({})
Outline.args = {
  variant: 'outline',
  children: 'Button',
}

export const Clear = Template.bind({})
Clear.args = {
  variant: 'clear',
  children: 'Button',
}

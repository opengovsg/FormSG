import { ButtonGroup } from '@chakra-ui/button'
import { Meta, Story } from '@storybook/react'
import { BiRightArrowAlt, BiUpload } from 'react-icons/bi'

import { centerDecorator } from '../../utils/storybook'

import { Button, ButtonProps } from './Button'

export default {
  title: 'Components/Button',
  component: Button,
  decorators: [centerDecorator],
} as Meta

const Template: Story<ButtonProps> = (args) => <Button {...args} />
export const Default = Template.bind({})
Default.args = {
  variant: 'primary',
  children: 'Button',
}

export const Variants = () => (
  <ButtonGroup>
    <Button>Primary</Button>
    <Button variant="success">Success</Button>
    <Button variant="danger">Danger</Button>
    <Button variant="reverse">Reverse</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="clear">Clear</Button>
  </ButtonGroup>
)

export const Disable = () => (
  <ButtonGroup>
    <Button isDisabled>Primary</Button>
    <Button isDisabled variant="success">
      Success
    </Button>
    <Button isDisabled variant="danger">
      Danger
    </Button>
    <Button isDisabled variant="reverse">
      Reverse
    </Button>
    <Button isDisabled variant="outline">
      Outline
    </Button>
    <Button isDisabled variant="clear">
      Clear
    </Button>
  </ButtonGroup>
)

export const WithIcon = () => (
  <ButtonGroup>
    <Button leftIcon={<BiUpload fontSize="24px" />}>Leading</Button>
    <Button rightIcon={<BiRightArrowAlt fontSize="24px" />}>Trailing</Button>
  </ButtonGroup>
)

export const Loading = () => (
  <ButtonGroup>
    <Button isLoading minW="84px" />
    <Button isLoading loadingText="With Text" />
  </ButtonGroup>
)

export const FocusTab = Template.bind({})
FocusTab.args = {
  children: 'Button',
}
FocusTab.parameters = { pseudo: { focus: true } }

export const Hover = Template.bind({})
Hover.args = {
  children: 'Button',
}
Hover.parameters = { pseudo: { hover: true } }

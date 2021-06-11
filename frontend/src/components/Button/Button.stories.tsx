import { BiRightArrowAlt, BiUpload } from 'react-icons/bi'
import { ButtonGroup } from '@chakra-ui/button'
import { SimpleGrid, Text } from '@chakra-ui/layout'
import { Meta, Story } from '@storybook/react'

import { centerDecorator } from '~utils/storybook'

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

export const FullWidth = Template.bind({})
FullWidth.args = {
  variant: 'primary',
  children: 'Button',
  isFullWidth: true,
}

export const Primary: Story = () => {
  return (
    <SimpleGrid
      columns={2}
      spacing={8}
      templateColumns="min-content auto"
      alignItems="center"
    >
      <Text>Default</Text>
      <ButtonGroup>
        <Button>Button</Button>
        <Button leftIcon={<BiUpload fontSize="1.5rem" />}>Leading</Button>
        <Button rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Active</Text>
      <ButtonGroup>
        <Button isActive>Button</Button>
        <Button isActive leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isActive rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Disabled</Text>
      <ButtonGroup>
        <Button isDisabled>Button</Button>
        <Button isDisabled leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isDisabled rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Loading</Text>
      <ButtonGroup>
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

export const Danger: Story = () => {
  return (
    <SimpleGrid
      columns={2}
      spacing={8}
      templateColumns="min-content auto"
      alignItems="center"
    >
      <Text>Default</Text>
      <ButtonGroup variant="danger">
        <Button>Button</Button>
        <Button leftIcon={<BiUpload fontSize="1.5rem" />}>Leading</Button>
        <Button rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Active</Text>
      <ButtonGroup variant="danger">
        <Button isActive>Button</Button>
        <Button isActive leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isActive rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Disabled</Text>
      <ButtonGroup variant="danger">
        <Button isDisabled>Button</Button>
        <Button isDisabled leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isDisabled rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Loading</Text>
      <ButtonGroup variant="danger">
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

export const Success: Story = () => {
  return (
    <SimpleGrid
      columns={2}
      spacing={8}
      templateColumns="min-content auto"
      alignItems="center"
    >
      <Text>Default</Text>
      <ButtonGroup variant="success">
        <Button>Button</Button>
        <Button leftIcon={<BiUpload fontSize="1.5rem" />}>Leading</Button>
        <Button rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Active</Text>
      <ButtonGroup variant="success">
        <Button isActive>Button</Button>
        <Button isActive leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isActive rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Disabled</Text>
      <ButtonGroup variant="success">
        <Button isDisabled>Button</Button>
        <Button isDisabled leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isDisabled rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Loading</Text>
      <ButtonGroup variant="success">
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

export const Reverse: Story = () => {
  return (
    <SimpleGrid
      columns={2}
      spacing={8}
      templateColumns="min-content auto"
      alignItems="center"
    >
      <Text>Default</Text>
      <ButtonGroup variant="reverse">
        <Button>Button</Button>
        <Button leftIcon={<BiUpload fontSize="1.5rem" />}>Leading</Button>
        <Button rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Active</Text>
      <ButtonGroup variant="reverse">
        <Button isActive>Button</Button>
        <Button isActive leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isActive rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Disabled</Text>
      <ButtonGroup variant="reverse">
        <Button isDisabled>Button</Button>
        <Button isDisabled leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isDisabled rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Loading</Text>
      <ButtonGroup variant="reverse">
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

export const Outline: Story = () => {
  return (
    <SimpleGrid
      columns={2}
      spacing={8}
      templateColumns="min-content auto"
      alignItems="center"
    >
      <Text>Default</Text>
      <ButtonGroup variant="outline">
        <Button>Button</Button>
        <Button leftIcon={<BiUpload fontSize="1.5rem" />}>Leading</Button>
        <Button rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Active</Text>
      <ButtonGroup variant="outline">
        <Button isActive>Button</Button>
        <Button isActive leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isActive rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Disabled</Text>
      <ButtonGroup variant="outline">
        <Button isDisabled>Button</Button>
        <Button isDisabled leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isDisabled rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Loading</Text>
      <ButtonGroup variant="outline">
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

export const Clear: Story = () => {
  return (
    <SimpleGrid
      columns={2}
      spacing={8}
      templateColumns="min-content auto"
      alignItems="center"
    >
      <Text>Default</Text>
      <ButtonGroup variant="clear">
        <Button>Button</Button>
        <Button leftIcon={<BiUpload fontSize="1.5rem" />}>Leading</Button>
        <Button rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Active</Text>
      <ButtonGroup variant="clear">
        <Button isActive>Button</Button>
        <Button isActive leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isActive rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Disabled</Text>
      <ButtonGroup variant="clear">
        <Button isDisabled>Button</Button>
        <Button isDisabled leftIcon={<BiUpload fontSize="1.5rem" />}>
          Leading
        </Button>
        <Button isDisabled rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}>
          Trailing
        </Button>
      </ButtonGroup>
      <Text>Loading</Text>
      <ButtonGroup variant="clear">
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

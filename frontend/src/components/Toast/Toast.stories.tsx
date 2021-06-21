import { SimpleGrid, Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { useToast, UseToastProps } from '~hooks/useToast'
import Button from '~components/Button'

import { Toast, ToastProps } from './Toast'

const ToastStateProps = {
  Warning: {
    status: 'warning',
    title: 'Warning',
    description: 'This is a toast for warning states',
    isClosable: true,
  },
  Success: {
    status: 'success',
    title: 'Success',
    description: 'This is a toast for success states',
    isClosable: true,
  },
  Error: {
    status: 'danger',
    title: 'Error',
    description: 'This is a toast for error states',
    isClosable: true,
  },
}
export default {
  title: 'Components/Toast',
  component: Toast,
  parameters: { backgrounds: { default: 'light' } },
  decorators: [
    // NOTE: The toast component requires this to display properly with theming
    // eslint-disable-next-line @typescript-eslint/ban-types
    (Story: Function) => (
      <>
        <Story />
      </>
    ),
  ],
} as Meta

const ToastTemplate: Story<ToastProps> = (args) => <Toast {...args} />
const ButtonWithToastTemplate: Story<UseToastProps> = (args) => {
  const toast = useToast()
  return (
    <Button
      onClick={() =>
        toast({
          onCloseComplete: () => console.log('hi'),
          ...args,
        })
      }
    >
      Toast!
    </Button>
  )
}

export const Success = ToastTemplate.bind({})
Success.args = ToastStateProps.Success

export const Error = ToastTemplate.bind({})
Error.args = ToastStateProps.Error
export const Warning = ToastTemplate.bind({})
Warning.args = ToastStateProps.Warning

export const ButtonWithToast = ButtonWithToastTemplate.bind({})
ButtonWithToast.args = {
  title: 'Some title',
  description: 'Some description',
  duration: 6000,
  isClosable: true,
  status: 'warning',
  position: 'top',
}

export const CombinedToasts: Story<ToastProps> = () => (
  <SimpleGrid
    columns={3}
    spacing={8}
    templateColumns="min-content auto"
    alignItems="center"
  >
    <Text>Success</Text>
    <Toast {...ToastStateProps.Success} />
    <Text>Warning</Text>
    <Toast {...ToastStateProps.Warning} />
    <Text>Error</Text>
    <Toast {...ToastStateProps.Error} />
  </SimpleGrid>
)

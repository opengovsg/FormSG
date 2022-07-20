import { useDisclosure } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { fullScreenDecorator, getMobileViewParameters } from '~utils/storybook'

import { ProgressModal, ProgressModalProps } from './ProgressModal'

export default {
  title: 'Features/Storage/ProgressModal',
  component: ProgressModal,
  decorators: [fullScreenDecorator],
  parameters: {
    layout: 'fullscreen',
    // Prevent flaky tests due to modal animating in.
    chromatic: { delay: 200 },
  },
  args: {
    downloadPercentage: 50,
  },
} as Meta<ProgressModalProps>

const Template: Story<ProgressModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })
  return (
    <ProgressModal
      {...modalProps}
      {...args}
      onClose={() => console.log('close modal')}
    />
  )
}
export const Desktop = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

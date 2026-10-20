import { useDisclosure } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { fullScreenDecorator, viewportModes } from '~utils/storybook'

import { ProgressModal, ProgressModalProps } from './ProgressModal'

export default {
  title: 'Features/Storage/ProgressModal',
  component: ProgressModal,
  decorators: [fullScreenDecorator],
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    // Prevent flaky tests due to modal animating in.
  },
  args: {
    downloadPercentage: 50,
  },
} as Meta<ProgressModalProps>

const Template: StoryFn<ProgressModalProps> = (args) => {
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
Desktop.parameters = { argos: { modes: viewportModes('mobile') } }

export const CompleteStateDesktop = Template.bind({})
CompleteStateDesktop.parameters = { argos: { modes: viewportModes('mobile') } }
CompleteStateDesktop.args = {
  downloadMetadata: {
    errorCount: 0,
    expectedCount: 9001,
    successCount: 9001,
  },
}

export const PartialSuccessStateDesktop = Template.bind({})
PartialSuccessStateDesktop.parameters = {
  argos: { modes: viewportModes('mobile') },
}
PartialSuccessStateDesktop.args = {
  downloadMetadata: {
    errorCount: 1,
    expectedCount: 9001,
    successCount: 9000,
  },
}

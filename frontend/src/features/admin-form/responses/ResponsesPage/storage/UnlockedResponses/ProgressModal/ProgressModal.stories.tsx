import { useDisclosure } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

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

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const CompleteStateDesktop = Template.bind({})
CompleteStateDesktop.args = {
  downloadMetadata: {
    errorCount: 0,
    expectedCount: 9001,
    successCount: 9001,
  },
}

export const CompleteStateMobile = Template.bind({})
CompleteStateMobile.args = CompleteStateDesktop.args
CompleteStateMobile.parameters = getMobileViewParameters()

export const PartialSuccessStateDesktop = Template.bind({})
PartialSuccessStateDesktop.args = {
  downloadMetadata: {
    errorCount: 1,
    expectedCount: 9001,
    successCount: 9000,
  },
}
export const PartialSuccessStateMobile = Template.bind({})
PartialSuccessStateMobile.args = PartialSuccessStateDesktop.args
PartialSuccessStateMobile.parameters = getMobileViewParameters()

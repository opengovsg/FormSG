import { useDisclosure } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { fullScreenDecorator, getMobileViewParameters } from '~utils/storybook'

import {
  DownloadWithAttachmentFlowStates,
  DownloadWithAttachmentModal,
  DownloadWithAttachmentModalProps,
} from './DownloadWithAttachmentModal'

export default {
  title: 'Features/Storage/DownloadWithAttachmentModal',
  component: DownloadWithAttachmentModal,
  decorators: [fullScreenDecorator],
  parameters: {
    layout: 'fullscreen',
    // Prevent flaky tests due to modal animating in.
    chromatic: { delay: 200 },
  },
} as Meta<DownloadWithAttachmentModalProps>

const Template: Story<DownloadWithAttachmentModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })
  return (
    <DownloadWithAttachmentModal
      {...modalProps}
      {...args}
      onDownload={() => console.log('Downloading...')}
      onClose={() => console.log('close modal')}
      onCancel={() => console.log('cancel download')}
    />
  )
}
export const ConfirmationStateDesktop = Template.bind({})
ConfirmationStateDesktop.args = {
  downloadPercentage: 0,
  isDownloading: false,
  responsesCount: 9001,
}
export const ConfirmationStateMobile = Template.bind({})
ConfirmationStateMobile.args = ConfirmationStateDesktop.args
ConfirmationStateMobile.parameters = getMobileViewParameters()

export const DownloadingStateDesktop = Template.bind({})
DownloadingStateDesktop.args = {
  initialState: [DownloadWithAttachmentFlowStates.Progress, -1],
  downloadPercentage: 30,
  isDownloading: false,
  responsesCount: 12345,
}

export const DownloadingStateMobile = Template.bind({})
DownloadingStateMobile.args = DownloadingStateDesktop.args
DownloadingStateMobile.parameters = getMobileViewParameters()

import { useDisclosure } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react-vite'

import {
  fullScreenDecorator,
  getMobileViewGlobals,
  viewportModes,
} from '~utils/storybook'

import {
  DownloadWithAttachmentFlowStates,
  DownloadWithAttachmentModal,
  DownloadWithAttachmentModalProps,
} from './DownloadWithAttachmentModal'

export default {
  title: 'Features/Storage/DownloadWithAttachmentModal',
  component: DownloadWithAttachmentModal,
  decorators: [fullScreenDecorator],
  args: {
    responsesCount: 12345,
    downloadOptions: {
      isDownloadAttachments: true,
      isDownloadCsv: true,
      isDownloadPdf: false,
    },
  },
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    // Prevent flaky tests due to modal animating in.
  },
} as Meta<DownloadWithAttachmentModalProps>

const Template: StoryFn<DownloadWithAttachmentModalProps> = (args) => {
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

export const ConfirmationScreenResponsesAndAttachmentsAndPdfsDesktop =
  Template.bind({})
ConfirmationScreenResponsesAndAttachmentsAndPdfsDesktop.args = {
  downloadPercentage: 0,
  isDownloading: false,
  responsesCount: 9001,
  downloadOptions: {
    isDownloadAttachments: true,
    isDownloadCsv: true,
    isDownloadPdf: true,
  },
}

export const ConfirmationStateResponseAndAttachmentsDesktop = Template.bind({})
ConfirmationStateResponseAndAttachmentsDesktop.parameters = {
  argos: { modes: viewportModes('mobile') },
}
ConfirmationStateResponseAndAttachmentsDesktop.args = {
  downloadPercentage: 0,
  isDownloading: false,
  responsesCount: 9001,
  downloadOptions: {
    isDownloadAttachments: true,
    isDownloadCsv: true,
    isDownloadPdf: false,
  },
}

export const ConfirmationScreenResponsesAndPdfsDesktop = Template.bind({})
ConfirmationScreenResponsesAndPdfsDesktop.args = {
  downloadPercentage: 0,
  isDownloading: false,
  responsesCount: 9001,
  downloadOptions: {
    isDownloadAttachments: false,
    isDownloadCsv: true,
    isDownloadPdf: true,
  },
}

export const ConfirmationScreenAttachmentsAndPdfsDesktop = Template.bind({})
ConfirmationScreenAttachmentsAndPdfsDesktop.args = {
  downloadPercentage: 0,
  isDownloading: false,
  responsesCount: 9001,
  downloadOptions: {
    isDownloadAttachments: true,
    isDownloadCsv: false,
    isDownloadPdf: true,
  },
}

export const ConfirmationStateAttachmentsOnlyDesktop = Template.bind({})
ConfirmationStateAttachmentsOnlyDesktop.parameters = {
  argos: { modes: viewportModes('mobile') },
}
ConfirmationStateAttachmentsOnlyDesktop.args = {
  downloadPercentage: 0,
  isDownloading: false,
  responsesCount: 9001,
  downloadOptions: {
    isDownloadAttachments: true,
    isDownloadCsv: false,
    isDownloadPdf: false,
  },
}

export const ConfirmationScreenPdfsOnlyDesktop = Template.bind({})
ConfirmationScreenPdfsOnlyDesktop.args = {
  downloadPercentage: 0,
  isDownloading: false,
  responsesCount: 9001,
  downloadOptions: {
    isDownloadAttachments: false,
    isDownloadCsv: false,
    isDownloadPdf: true,
  },
}

export const DownloadingStateDesktop = Template.bind({})
DownloadingStateDesktop.parameters = {
  argos: { modes: viewportModes('mobile') },
}
DownloadingStateDesktop.args = {
  initialState: [DownloadWithAttachmentFlowStates.Progress, -1],
  downloadPercentage: 30,
  isDownloading: false,
  responsesCount: 12345,
}

export const CompleteStateDesktop = Template.bind({})
CompleteStateDesktop.parameters = { argos: { modes: viewportModes('mobile') } }
CompleteStateDesktop.args = {
  downloadMetadata: {
    errorCount: 0,
    successCount: 12345,
    expectedCount: 12345,
  },
}

export const CanceledStateDesktop = Template.bind({})
CanceledStateDesktop.args = {
  downloadMetadata: {
    isCanceled: true,
  },
}

export const PartialSuccessStateDesktop = Template.bind({})
PartialSuccessStateDesktop.args = {
  downloadMetadata: {
    errorCount: 10,
    successCount: 12335,
    expectedCount: 12345,
  },
}

export const PartialSuccessStateMobile = Template.bind({})
PartialSuccessStateMobile.args = {
  downloadMetadata: {
    errorCount: 1,
    successCount: 1,
    expectedCount: 2,
  },
}

PartialSuccessStateMobile.globals = getMobileViewGlobals()

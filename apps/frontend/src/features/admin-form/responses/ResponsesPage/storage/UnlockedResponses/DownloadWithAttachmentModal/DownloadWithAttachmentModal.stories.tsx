import { useState } from 'react'
import { useDisclosure } from '@chakra-ui/react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { featureFlags } from 'formsg-shared/constants'
import {
  AttachmentSize,
  BasicField,
  FormFieldDto,
} from 'formsg-shared/types/field'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import {
  fullScreenDecorator,
  getMobileViewGlobals,
  StoryRouter,
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

// PROTOTYPE (attachments-v2): one zip, with the "Name folders by" picker.
const attachmentsV2On = new GrowthBook({
  features: { [featureFlags.attachmentsV2]: { defaultValue: true } },
})
const V2Template: StoryFn<DownloadWithAttachmentModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })
  const [downloadOptions, setDownloadOptions] = useState(args.downloadOptions)
  return (
    <GrowthBookProvider growthbook={attachmentsV2On}>
      <DownloadWithAttachmentModal
        {...modalProps}
        {...args}
        downloadOptions={downloadOptions}
        onDownloadOptionsChange={setDownloadOptions}
        onDownload={() => console.log('Downloading...', downloadOptions)}
        onClose={() => console.log('close modal')}
        onCancel={() => console.log('cancel download')}
      />
    </GrowthBookProvider>
  )
}

export const V2OneZipWithFolderNames = V2Template.bind({})
V2OneZipWithFolderNames.decorators = [
  StoryRouter({
    initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
    path: '/:formId',
  }),
]
V2OneZipWithFolderNames.parameters = {
  msw: createFormBuilderMocks(
    {
      form_fields: [
        {
          _id: '611b94dfbb9e300012f702a1',
          title: 'Full name',
          description: '',
          required: true,
          disabled: false,
          fieldType: BasicField.ShortText,
          ValidationOptions: { customVal: null, selectedValidation: null },
        },
        {
          _id: '611b94dfbb9e300012f702a2',
          title: 'Supporting documents',
          description: '',
          required: true,
          disabled: false,
          fieldType: BasicField.Attachment,
          attachmentSize: AttachmentSize.SevenMb,
        },
      ] as FormFieldDto[],
    },
    0,
  ),
}
V2OneZipWithFolderNames.args = {
  downloadPercentage: 0,
  isDownloading: false,
  responsesCount: 120,
  downloadOptions: {
    isDownloadAttachments: true,
    isDownloadCsv: true,
    isDownloadPdf: true,
  },
}

import { useForm } from 'react-hook-form'
import { expect, screen, userEvent, waitFor } from '@storybook/test'

import { StoryRouter } from '~utils/storybook'

import { ConditionalRoutingConfig } from './ConditionalRoutingOption'
import {
  ConditionalRoutingOptionModal,
  ConditionalRoutingOptionModalProps,
} from './ConditionalRoutingOptionModal'

const ModalContainer = ({
  isOpen,
  onClose,
  errors,
  onDownloadCsvClick,
  onSubmit,
  isSubmitDisabled,
  validateCsvFile,
  csvFile,
  existingCsv,
}: Omit<ConditionalRoutingOptionModalProps, 'control'> & {
  csvFile?: File | null
}) => {
  const { control } = useForm<ConditionalRoutingConfig>({
    defaultValues: {
      csvFile,
    },
  })

  return (
    <ConditionalRoutingOptionModal
      isOpen={isOpen}
      onClose={onClose}
      control={control}
      errors={errors}
      onDownloadCsvClick={onDownloadCsvClick}
      onSubmit={onSubmit}
      isSubmitDisabled={isSubmitDisabled}
      validateCsvFile={validateCsvFile}
      conditionalFieldItems={[]}
      isLoading={false}
      existingCsv={existingCsv}
    />
  )
}

const defaultArgs = {
  isOpen: true,
  onClose: () => {},
  errors: {},
  onDownloadCsvClick: () => {},
  onSubmit: () => {},
  isSubmitDisabled: false,
  validateCsvFile: async () => undefined,
}

const testFile = new File(['content'], 'test.csv', { type: 'text/csv' })

export default {
  component: ModalContainer,
  title:
    'Features/AdminForm/create/workflow/components/WorkflowContent/EditStepBlock/ConditionalRoutingOptionModal',
  args: defaultArgs,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
}

export const DownloadCsvTemplateStep = {}

export const UploadCsvFileStep = {
  play: async () => {
    const downloadButton = screen.getByText('Download and edit CSV template')
    const nextButton = screen.getByText('Next: Upload CSV file')
    await waitFor(
      async () => {
        expect(downloadButton).not.toBeDisabled()
        await userEvent.click(downloadButton)
      },
      { timeout: 5000 },
    )
    await waitFor(
      async () => {
        expect(nextButton).not.toBeDisabled()
        await userEvent.click(nextButton)
      },
      { timeout: 5000 },
    )
    await waitFor(
      async () => {
        expect(
          screen.getByText('Upload your completed CSV file'),
        ).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  },
}

export const UploadCsvFileStepWithAttachmentSelected = {
  play: async () => {
    const downloadButton = screen.getByText('Download and edit CSV template')
    const nextButton = screen.getByText('Next: Upload CSV file')
    await waitFor(
      async () => {
        expect(downloadButton).not.toBeDisabled()
        await userEvent.click(downloadButton)
      },
      { timeout: 5000 },
    )
    await waitFor(
      async () => {
        expect(nextButton).not.toBeDisabled()
        await userEvent.click(nextButton)
      },
      { timeout: 5000 },
    )

    await waitFor(
      async () => {
        expect(
          screen.getByText('Upload your completed CSV file'),
        ).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  },
  args: {
    csvFile: new File([''], 'test.csv', { type: 'text/csv' }),
  },
}

export const UploadCsvFileStepWithAttachmentSelectedDummyErrorMessage = {
  play: async () => {
    const downloadButton = screen.getByText('Download and edit CSV template')
    const nextButton = screen.getByText('Next: Upload CSV file')
    await waitFor(
      async () => {
        expect(downloadButton).not.toBeDisabled()
        await userEvent.click(downloadButton)
      },
      { timeout: 5000 },
    )
    await waitFor(
      async () => {
        expect(nextButton).not.toBeDisabled()
        await userEvent.click(nextButton)
      },
      { timeout: 5000 },
    )

    await waitFor(
      async () => {
        expect(
          screen.getByText('Upload your completed CSV file'),
        ).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  },
  args: {
    csvFile: new File([''], 'test.csv', { type: 'text/csv' }),
    errors: {
      csvFile: {
        message: 'Dummy error message',
      },
    },
  },
}

export const ReplaceCSVFileStepEmpty = {
  args: {
    ...defaultArgs,
    existingCsv: testFile,
  },
  play: async () => {
    await waitFor(
      async () => {
        expect(screen.getByText('Replace your CSV file')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  },
}

export const ReplaceCSVFileStep = {
  args: {
    ...defaultArgs,
    existingCsv: testFile,
    csvFile: testFile,
  },
  play: async () => {
    await waitFor(
      async () => {
        expect(screen.getByText('Replace your CSV file')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  },
}

export const ReplaceCSVFileStepErrorMessage = {
  args: {
    ...defaultArgs,
    existingCsv: testFile,
    csvFile: testFile,
    errors: {
      csvFile: {
        message: 'Dummy error message',
      },
    },
  },
  play: async () => {
    await waitFor(
      async () => {
        expect(screen.getByText('Replace your CSV file')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  },
}

import { useForm } from 'react-hook-form'
import { expect, screen, userEvent, waitFor } from '@storybook/test'
// eslint-disable-next-line storybook/use-storybook-testing-library
import { renderHook } from '@testing-library/react'

import { StoryRouter } from '~utils/storybook'

import { ConditionalRoutingOptionModal } from './ConditionalRoutingOptionModal'
import { ConditionalRoutingConfig } from './RespondentBlock'

const { result } = renderHook(() => useForm<ConditionalRoutingConfig>())

export default {
  component: ConditionalRoutingOptionModal,
  title:
    'Features/AdminForm/create/workflow/components/WorkflowContent/EditStepBlock/ConditionalRoutingOptionModal',
  args: {
    isOpen: true,
    onClose: () => {},
    control: result.current.control,
    errors: {},
    onDownloadCsvClick: () => {},
    onSubmit: () => {},
    isSubmitDisabled: false,
    validateCsvFile: async () => undefined,
  },
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
}

export const DownloadCsvTemplateStep = {}

export const UploadCsvFileStep = {
  play: async () => {
    const nextButton = screen.getByText('Next: Upload CSV template')
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
          screen.getByText('Upload your completed CSV template'),
        ).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  },
}

export const UploadCsvFileStepWithAttachmentSelected = {
  play: async () => {
    // First navigate to upload step
    const nextButton = screen.getByText('Next: Upload CSV template')
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
          screen.getByText('Upload your completed CSV template'),
        ).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  },
  args: {
    control: renderHook(() =>
      useForm<ConditionalRoutingConfig>({
        defaultValues: {
          csvFile: new File([''], 'test.csv', { type: 'text/csv' }),
        },
      }),
    ).result.current.control,
  },
}

export const UploadCsvFileStepWithAttachmentSelectedDummyErrorMessage = {
  play: async () => {
    // First navigate to upload step
    const nextButton = screen.getByText('Next: Upload CSV template')
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
          screen.getByText('Upload your completed CSV template'),
        ).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  },
  args: {
    control: renderHook(() =>
      useForm<ConditionalRoutingConfig>({
        defaultValues: {
          csvFile: new File([''], 'test.csv', { type: 'text/csv' }),
        },
      }),
    ).result.current.control,
    errors: {
      csvFile: {
        message: 'Dummy error message',
      },
    },
  },
}

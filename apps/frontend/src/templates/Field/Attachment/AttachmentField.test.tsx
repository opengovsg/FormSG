import { datadogLogs } from '@datadog/browser-logs'
import { composeStories } from '@storybook/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import imageCompression from 'browser-image-compression'
import JSZip from 'jszip'
import { merge } from 'lodash'

import { MB } from 'formsg-shared/constants/file'
import { AttachmentSize } from 'formsg-shared/types/field'
import { VALID_EXTENSIONS } from 'formsg-shared/utils/file-validation'

import { REQUIRED_ERROR } from '~constants/validation'
import fileArrayBuffer from '~utils/fileArrayBuffer'

import {
  PublicFormContext,
  PublicFormContextProps,
} from '~features/public-form/PublicFormContext'

import { AttachmentFieldSchema } from '../types'

import * as stories from './AttachmentField.stories'

vi.mock('browser-image-compression', () => ({
  __esModule: true,
  default: vi.fn(),
}))

vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: {
    logger: {
      warn: vi.fn(),
      error: vi.fn(),
    },
  },
}))

vi.mock('~utils/fileArrayBuffer', async () => {
  const actual = await vi.importActual<typeof import('~utils/fileArrayBuffer')>(
    '~utils/fileArrayBuffer',
  )
  return {
    __esModule: true,
    default: vi.fn(actual.default),
  }
})

const { ValidationRequired, ValidationOptional } = composeStories(stories)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('validation required', () => {
  it('renders error when field is not filled before submitting', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)
    const submitButton = screen.getByText('Submit')

    // Act
    await user.click(submitButton)

    // Assert
    // Should show error message.
    const error = screen.getByText(REQUIRED_ERROR)
    expect(error).not.toBeNull()
  })

  it('renders success when submitting with a valid file upload', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema = ValidationRequired.args?.schema
    render(<ValidationRequired />)
    const input = screen.getByTestId(schema!._id) as HTMLInputElement
    const submitButton = screen.getByRole('button', {
      name: /submit/i,
    })

    expect(input.value).toBe('')

    // Act
    // Valid file
    const testFile = new File(['(⌐□_□)'], 'chucknorris.png', {
      type: 'image/png',
    })
    await user.upload(input, testFile)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    const success = screen.getByText(/you have submitted[\s\S]*chuck/i)
    expect(success).not.toBeNull()
    const error = screen.queryByText(REQUIRED_ERROR)
    expect(error).toBeNull()
  })
})

describe('validation optional', () => {
  it('renders success even when field is empty before submitting', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationOptional />)
    const submitButton = screen.getByText('Submit')

    // Act
    await user.click(submitButton)

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: Nothing was selected')
    expect(success).not.toBeNull()
  })

  it('renders success when submitting with a valid file upload', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema = ValidationOptional.args?.schema
    render(<ValidationOptional />)
    const input = screen.getByTestId(schema!._id) as HTMLInputElement
    const submitButton = screen.getByRole('button', {
      name: /submit/i,
    })

    expect(input.value).toBe('')

    // Act
    // Valid file
    const testFile = new File(
      ["We're no strangers to love"],
      'rickastley.png',
      {
        type: 'image/png',
      },
    )
    await user.upload(input, testFile)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    const success = screen.getByText(/you have submitted[\s\S]*rick/i)
    expect(success).not.toBeNull()
    const error = screen.queryByText(REQUIRED_ERROR)
    expect(error).toBeNull()
  })
})

describe('attachment validation', () => {
  it('renders error when file with invalid extension is uploaded', async () => {
    // Arrange
    const user = userEvent.setup({ applyAccept: false })
    const schema = ValidationOptional.args?.schema
    render(<ValidationOptional />)
    const input = screen.getByTestId(schema!._id) as HTMLInputElement
    const invalidExtension = '.rubbish'

    expect(VALID_EXTENSIONS.includes(invalidExtension)).toEqual(false)

    // Act
    // Valid file
    const testFile = new File(['Some invalid file'], `sus${invalidExtension}`)
    await user.upload(input, testFile)
    // No need to click submit, or the error message will be overridden.

    // Assert
    // Should show error message.
    const error = screen.getByText(
      /your file's extension ending in \*.rubbish is not allowed/i,
    )
    expect(error).not.toBeNull()
  })

  it('renders error when file that exceeds schema max size is uploaded', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema: AttachmentFieldSchema = merge(
      {},
      ValidationOptional.args?.schema,
      { attachmentSize: AttachmentSize.OneMb },
    )
    render(<ValidationOptional schema={schema} />)
    const input = screen.getByTestId(schema!._id) as HTMLInputElement
    const invalidExtension = '.rubbish'

    expect(VALID_EXTENSIONS.includes(invalidExtension)).toEqual(false)

    // Act
    // Valid large file
    const mockLargeFile = new File(
      ["We're no strangers to love"],
      'rickastley.pdf',
      {
        type: 'application/pdf',
      },
    )
    Object.defineProperty(mockLargeFile, 'size', { value: 1.001 * MB })
    await user.upload(input, mockLargeFile)
    // No need to click submit, or the error message will be overridden.

    // Assert
    // Should show error message.
    const error = screen.getByText(
      /You have exceeded the file size limit, please upload a file below 1 MB/i,
    )
    expect(error).not.toBeNull()
  })

  it('rejects 0-byte image file at the dropzone validator', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema = ValidationOptional.args?.schema
    render(<ValidationOptional />)
    const input = screen.getByTestId(schema!._id) as HTMLInputElement

    // Act — 0-byte PNG (image type goes through the compression branch
    // and previously bypassed the size===0 validator check).
    const emptyImage = new File([], 'empty.png', { type: 'image/png' })
    Object.defineProperty(emptyImage, 'size', { value: 0 })
    await user.upload(input, emptyImage)

    // Assert — fileEmpty validator error surfaces (not the compression path).
    await waitFor(() => {
      const error = screen.queryByText(/you have uploaded an empty file/i)
      expect(error).not.toBeNull()
    })
  })

  it('rejects empty image-compression blob, surfaces processing error, and logs warn', async () => {
    // Arrange — schema is 1MB so a 2MB image triggers the compression branch.
    const user = userEvent.setup()
    const schema: AttachmentFieldSchema = merge(
      {},
      ValidationOptional.args?.schema,
      { attachmentSize: AttachmentSize.OneMb },
    )
    render(<ValidationOptional schema={schema} />)
    const input = screen.getByTestId(schema!._id) as HTMLInputElement

    // imageCompression resolves to an empty blob (the regression scenario).
    vi.mocked(imageCompression).mockResolvedValueOnce(
      new Blob([], { type: 'image/jpeg' }) as unknown as File,
    )

    const largeImage = new File(['x'], 'photo.png', { type: 'image/png' })
    Object.defineProperty(largeImage, 'size', { value: 2 * MB })

    // Act
    await user.upload(input, largeImage)

    // Assert — user sees the new processing-error message.
    await waitFor(() => {
      const error = screen.queryByText(
        /there was an issue processing your image/i,
      )
      expect(error).not.toBeNull()
    })

    // Assert — onChange was NOT called: no file info / no "you have submitted" success.
    // The dropzone should still be present (no AttachmentFileInfo rendered).
    expect(screen.queryByLabelText(/click to remove file/i)).toBeNull()

    // Assert — datadog warn emitted once with the documented payload shape.
    expect(datadogLogs.logger.warn).toHaveBeenCalledTimes(1)
    const [, payload] = vi.mocked(datadogLogs.logger.warn).mock.calls[0]
    expect(payload).toMatchObject({
      reason: 'imageCompressionEmpty',
      fileName: 'photo.png',
      originalSize: 2 * MB,
      originalType: 'image/png',
    })
    // Privacy: payload must only carry metadata, never file contents.
    expect(Object.keys(payload as object).sort()).toEqual(
      ['fileName', 'formId', 'originalSize', 'originalType', 'reason'].sort(),
    )
  })

  it('rejects empty file clone, shows reading error, and logs warn', async () => {
    // Arrange — fileArrayBuffer returns an empty buffer, so the clone is 0 bytes
    // even though the source file is not. The clone is what flows to S3, so this
    // is the path that previously slipped past the dropzone validator.
    const user = userEvent.setup()
    const schema = ValidationOptional.args?.schema
    render(<ValidationOptional />)
    const input = screen.getByTestId(schema!._id) as HTMLInputElement

    vi.mocked(fileArrayBuffer).mockResolvedValueOnce(new ArrayBuffer(0))

    const sourceFile = new File(['real content'], 'doc.pdf', {
      type: 'application/pdf',
    })

    // Act
    await user.upload(input, sourceFile)

    // Assert — existing reading-error message surfaces.
    await waitFor(() => {
      const error = screen.queryByText(/error reading your file/i)
      expect(error).not.toBeNull()
    })

    // Assert — no file ends up attached (no remove-file affordance rendered).
    expect(screen.queryByLabelText(/click to remove file/i)).toBeNull()

    // Assert — exactly one warn with fileCloneEmpty reason and both sizes.
    expect(datadogLogs.logger.warn).toHaveBeenCalledTimes(1)
    const [, payload] = vi.mocked(datadogLogs.logger.warn).mock.calls[0]
    expect(payload).toMatchObject({
      reason: 'fileCloneEmpty',
      fileName: 'doc.pdf',
      originalSize: sourceFile.size,
      cloneSize: 0,
    })
    // Privacy: payload must only carry metadata, never file contents.
    expect(Object.keys(payload as object).sort()).toEqual(
      ['cloneSize', 'fileName', 'formId', 'originalSize', 'reason'].sort(),
    )
  })

  it('logs the public-form formId in empty-clone warn payload when wrapped in PublicFormContext', async () => {
    // Arrange — when the field is rendered inside a public-form flow, the
    // datadog warn payload must carry the form's id so quarantine-bucket
    // triage can link the event back to the originating form.
    const user = userEvent.setup()
    const schema = ValidationOptional.args?.schema
    const PUBLIC_FORM_ID = 'public-form-id-clone'
    const providerValue = {
      formId: PUBLIC_FORM_ID,
    } as unknown as PublicFormContextProps

    render(
      <PublicFormContext.Provider value={providerValue}>
        <ValidationOptional />
      </PublicFormContext.Provider>,
    )
    const input = screen.getByTestId(schema!._id) as HTMLInputElement

    vi.mocked(fileArrayBuffer).mockResolvedValueOnce(new ArrayBuffer(0))

    const sourceFile = new File(['real content'], 'doc.pdf', {
      type: 'application/pdf',
    })

    // Act
    await user.upload(input, sourceFile)

    // Assert
    await waitFor(() => {
      expect(datadogLogs.logger.warn).toHaveBeenCalledTimes(1)
    })
    const [, payload] = vi.mocked(datadogLogs.logger.warn).mock.calls[0]
    expect(payload).toMatchObject({
      reason: 'fileCloneEmpty',
      formId: PUBLIC_FORM_ID,
    })
  })

  it('logs the public-form formId in empty-compression warn payload when wrapped in PublicFormContext', async () => {
    // Arrange — public-form flow + image-compression returns an empty blob.
    const user = userEvent.setup()
    const schema: AttachmentFieldSchema = merge(
      {},
      ValidationOptional.args?.schema,
      { attachmentSize: AttachmentSize.OneMb },
    )
    const PUBLIC_FORM_ID = 'public-form-id-compress'
    const providerValue = {
      formId: PUBLIC_FORM_ID,
    } as unknown as PublicFormContextProps

    render(
      <PublicFormContext.Provider value={providerValue}>
        <ValidationOptional schema={schema} />
      </PublicFormContext.Provider>,
    )
    const input = screen.getByTestId(schema!._id) as HTMLInputElement

    vi.mocked(imageCompression).mockResolvedValueOnce(
      new Blob([], { type: 'image/jpeg' }) as unknown as File,
    )

    const largeImage = new File(['x'], 'photo.png', { type: 'image/png' })
    Object.defineProperty(largeImage, 'size', { value: 2 * MB })

    // Act
    await user.upload(input, largeImage)

    // Assert
    await waitFor(() => {
      expect(datadogLogs.logger.warn).toHaveBeenCalledTimes(1)
    })
    const [, payload] = vi.mocked(datadogLogs.logger.warn).mock.calls[0]
    expect(payload).toMatchObject({
      reason: 'imageCompressionEmpty',
      formId: PUBLIC_FORM_ID,
    })
  })

  it('renders error when zip file contains invalid extensions', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema = ValidationRequired.args?.schema
    render(<ValidationRequired />)
    const input = screen.getByTestId(schema!._id) as HTMLInputElement
    const mockZip = async () => {
      const zip = new JSZip()
      zip.file(
        'rickroll.txt',
        "We're no strangers to love\nYou know the rules and so do I",
      )
      // Invalid extension
      zip.file('trololo.rubbish', 'Na na nah nah na na.\nLololololoooool')
      const fileContent = await zip.generateAsync({ type: 'blob' })
      const testFile = new File([fileContent], 'lyrics.zip', {
        type: 'application/zip',
      })

      return testFile
    }

    // Act
    // Mack mock zip file
    const testFile = await mockZip()
    await user.upload(input, testFile)
    // Don't need to submit, or the error message will be overridden.

    // Assert
    // Should show error message.
    await waitFor(() => {
      const error = screen.queryByText(
        /The following file extensions in your zip file are not valid: .rubbish/i,
      )
      expect(error).not.toBeNull()
    })
  })

  it('renders success with valid zip file upload', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema = ValidationRequired.args?.schema
    render(<ValidationRequired />)
    const input = screen.getByTestId(schema!._id) as HTMLInputElement
    const submitButton = screen.getByRole('button', {
      name: /submit/i,
    })
    const mockZip = async () => {
      const zip = new JSZip()
      zip.file(
        'rickroll.txt',
        "We're no strangers to love\nYou know the rules and so do I",
      )
      zip.file('trololo.txt', 'Na na nah nah na na.\nLololololoooool')
      const fileContent = await zip.generateAsync({ type: 'blob' })
      const testFile = new File([fileContent], 'lyrics.zip', {
        type: 'application/zip',
      })

      return testFile
    }

    // Act
    // Mack mock zip file with all valid extensions.
    const testFile = await mockZip()
    await user.upload(input, testFile)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    const success = screen.getByText(/you have submitted[\s\S]*lyrics/i)
    expect(success).not.toBeNull()
    const error = screen.queryByText(REQUIRED_ERROR)
    expect(error).toBeNull()
  })
})

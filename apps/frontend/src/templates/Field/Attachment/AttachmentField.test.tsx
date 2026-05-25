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
  const PUBLIC_FORM_ID = 'public-form-id'
  const providerValue = {
    formId: PUBLIC_FORM_ID,
  } as unknown as PublicFormContextProps

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

    // Act
    // RATIONALE: image types previously bypassed the size===0 check via the
    // compression branch — this is the regression we guard against.
    const zeroByteImage = new File([], 'empty.png', { type: 'image/png' })
    Object.defineProperty(zeroByteImage, 'size', { value: 0 })
    await user.upload(input, zeroByteImage)

    // Assert
    await waitFor(() => {
      const fileEmptyError = screen.queryByText(
        /you have uploaded an empty file/i,
      )
      expect(fileEmptyError).not.toBeNull()
    })
  })

  it('rejects empty image-compression blob, surfaces processing error, and logs warn', async () => {
    // Arrange
    const user = userEvent.setup()
    const oneMbLimitSchema: AttachmentFieldSchema = merge(
      {},
      ValidationOptional.args?.schema,
      { attachmentSize: AttachmentSize.OneMb },
    )
    render(<ValidationOptional schema={oneMbLimitSchema} />)
    const input = screen.getByTestId(oneMbLimitSchema._id) as HTMLInputElement

    const emptyCompressedBlob = new Blob([], {
      type: 'image/jpeg',
    }) as unknown as File
    vi.mocked(imageCompression).mockResolvedValueOnce(emptyCompressedBlob)

    const overSizeLimitImage = new File(['x'], 'photo.png', {
      type: 'image/png',
    })
    Object.defineProperty(overSizeLimitImage, 'size', { value: 2 * MB })

    // Act
    await user.upload(input, overSizeLimitImage)

    // Assert
    await waitFor(() => {
      const processingError = screen.queryByText(
        /there was an issue processing your image/i,
      )
      expect(processingError).not.toBeNull()
    })

    const removeFileAffordance =
      screen.queryByLabelText(/click to remove file/i)
    expect(removeFileAffordance).toBeNull()

    expect(datadogLogs.logger.warn).toHaveBeenCalledTimes(1)
    const [, payload] = vi.mocked(datadogLogs.logger.warn).mock.calls[0]
    expect(payload).toMatchObject({
      reason: 'imageCompressionEmpty',
      fileName: 'photo.png',
      originalSize: 2 * MB,
      originalType: 'image/png',
    })
    // RATIONALE: payload must only carry metadata, never file contents (privacy).
    expect(Object.keys(payload as object).sort()).toEqual(
      ['fileName', 'formId', 'originalSize', 'originalType', 'reason'].sort(),
    )
  })

  it('rejects empty file clone, shows reading error, and logs warn', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema = ValidationOptional.args?.schema
    render(<ValidationOptional />)
    const input = screen.getByTestId(schema!._id) as HTMLInputElement

    // RATIONALE: the cloned file, not the source file, is what flows to S3, so a
    // 0-byte clone from a non-empty source is the path that previously
    // slipped past the dropzone validator.
    vi.mocked(fileArrayBuffer).mockResolvedValueOnce(new ArrayBuffer(0))

    const nonEmptySourceFile = new File(['real content'], 'doc.pdf', {
      type: 'application/pdf',
    })

    // Act
    await user.upload(input, nonEmptySourceFile)

    // Assert
    await waitFor(() => {
      const readingError = screen.queryByText(/error reading your file/i)
      expect(readingError).not.toBeNull()
    })

    const removeFileAffordance =
      screen.queryByLabelText(/click to remove file/i)
    expect(removeFileAffordance).toBeNull()

    expect(datadogLogs.logger.warn).toHaveBeenCalledTimes(1)
    const [, payload] = vi.mocked(datadogLogs.logger.warn).mock.calls[0]
    expect(payload).toMatchObject({
      reason: 'fileCloneEmpty',
      fileName: 'doc.pdf',
      originalSize: nonEmptySourceFile.size,
      cloneSize: 0,
    })
    // RATIONALE: payload must only carry metadata, never file contents (privacy).
    expect(Object.keys(payload as object).sort()).toEqual(
      ['cloneSize', 'fileName', 'formId', 'originalSize', 'reason'].sort(),
    )
  })

  it('logs the public-form formId in empty-clone warn payload when wrapped in PublicFormContext', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema = ValidationOptional.args?.schema

    render(
      <PublicFormContext.Provider value={providerValue}>
        <ValidationOptional />
      </PublicFormContext.Provider>,
    )
    const input = screen.getByTestId(schema!._id) as HTMLInputElement

    vi.mocked(fileArrayBuffer).mockResolvedValueOnce(new ArrayBuffer(0))

    const nonEmptySourceFile = new File(['real content'], 'doc.pdf', {
      type: 'application/pdf',
    })

    // Act
    await user.upload(input, nonEmptySourceFile)

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
    // Arrange
    const user = userEvent.setup()
    const oneMbLimitSchema: AttachmentFieldSchema = merge(
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
        <ValidationOptional schema={oneMbLimitSchema} />
      </PublicFormContext.Provider>,
    )
    const input = screen.getByTestId(oneMbLimitSchema._id) as HTMLInputElement

    const emptyCompressedBlob = new Blob([], {
      type: 'image/jpeg',
    }) as unknown as File
    vi.mocked(imageCompression).mockResolvedValueOnce(emptyCompressedBlob)

    const overSizeLimitImage = new File(['x'], 'photo.png', {
      type: 'image/png',
    })
    Object.defineProperty(overSizeLimitImage, 'size', { value: 2 * MB })

    // Act
    await user.upload(input, overSizeLimitImage)

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

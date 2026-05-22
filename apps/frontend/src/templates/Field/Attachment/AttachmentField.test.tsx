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

const { ValidationRequired, ValidationOptional } = composeStories(stories)

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

    // Assert
    await waitFor(() => {
      const error = screen.queryByText(
        /An error has occurred whilst parsing your zip file/i,
      )
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

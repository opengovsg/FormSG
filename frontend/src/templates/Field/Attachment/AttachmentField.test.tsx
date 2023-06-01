import { composeStories } from '@storybook/testing-react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JSZip from 'jszip'
import { merge } from 'lodash'

import { MB } from '~shared/constants/file'
import { AttachmentSize } from '~shared/types/field'
import { VALID_EXTENSIONS } from '~shared/utils/file-validation'

import { REQUIRED_ERROR } from '~constants/validation'

import { AttachmentFieldSchema } from '../types'

import * as stories from './AttachmentField.stories'

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
      /You have exceeded the limit, please upload a file below 1 MB/i,
    )
    expect(error).not.toBeNull()
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
        /The following file extension in your zip file is not valid: .rubbish/i,
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

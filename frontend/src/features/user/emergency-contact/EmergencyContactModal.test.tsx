import { composeStories } from '@storybook/testing-react'
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import parsePhoneNumber from 'libphonenumber-js'

import { MOCK_USER } from '~/mocks/msw/handlers/user'

import { INVALID_NUMBER_ERROR_MSG } from './components/ContactNumberInput'
import * as stories from './EmergencyContactModal.stories'

const { NoContact, WithContact } = composeStories(stories)

// Some tests take longer in this suite.
jest.setTimeout(10000)

describe('User has no verified contact number', () => {
  it('should render with empty contact number details', async () => {
    // Arrange
    render(<NoContact />)
    // Wait until all async stuff has rendered
    await waitForElementToBeRemoved(() =>
      screen.queryByPlaceholderText('Loading user...'),
    )
    const input = screen.getByLabelText('Mobile number') as HTMLInputElement
    const vfnButton = screen.getByRole('button', { name: 'Verify' })

    // Assert
    // Should be empty value
    expect(input).toHaveDisplayValue('')
    // Verification button should be enabled.
    expect(vfnButton).not.toBeDisabled()
  })

  it('should update user contact successfully', async () => {
    // Arrange
    render(<NoContact />)
    // Wait until all async stuff has rendered
    await waitForElementToBeRemoved(() =>
      screen.queryByPlaceholderText('Loading user...'),
    )
    const contactNumInput = screen.getByLabelText(
      'Mobile number',
    ) as HTMLInputElement
    const vfnButton = screen.getByRole('button', { name: 'Verify' })
    const mockNumber = '98765432'
    const expectedFormattedPhoneNumber = parsePhoneNumber(
      `+65${mockNumber}`,
    )!.formatInternational()

    // Act
    userEvent.type(contactNumInput, mockNumber)
    userEvent.tab()
    // Input should now have formatted value.
    expect(vfnButton).toHaveTextContent('Verify')
    expect(contactNumInput).toHaveDisplayValue(expectedFormattedPhoneNumber)
    userEvent.click(vfnButton)
    const otpInput = await screen.findByTestId('otp-input')
    const otpSubmitButton = await screen.findByRole('button', {
      name: 'Submit',
    })

    // Assert
    // Should now show OTP verification box
    expect(otpInput).toBeInTheDocument()

    // Act
    userEvent.type(otpInput, '123456')
    userEvent.click(otpSubmitButton)
    await waitForElementToBeRemoved(otpInput)

    // Assert
    // Toast should appear.
    await waitFor(() => {
      expect(screen.getByText('Emergency contact added.')).toBeTruthy()
    })
    // Should now show updated phone number in input, with verified button
    expect(contactNumInput).toHaveDisplayValue(expectedFormattedPhoneNumber)
    expect(vfnButton).toHaveTextContent('Verified')
    expect(vfnButton).toBeDisabled()
  })
})

describe('User has verified contact number', () => {
  it('should render with verified contact number details', async () => {
    // Arrange
    render(<WithContact />)
    // Wait until all async stuff has rendered
    await waitForElementToBeRemoved(() =>
      screen.queryByPlaceholderText('Loading user...'),
    )
    const input = screen.getByLabelText('Mobile number') as HTMLInputElement
    const vfnButton = screen.getByRole('button', { name: 'Verified' })
    const expectedFormattedPhoneNumber = parsePhoneNumber(
      MOCK_USER.contact,
    )!.formatInternational()

    // Assert
    expect(expectedFormattedPhoneNumber).toBeDefined()
    // Should prefill the input with the user's contact number.
    expect(input).toHaveDisplayValue(expectedFormattedPhoneNumber)
    // Verification button should be disabled.
    expect(vfnButton).toBeDisabled()
  })

  it('should render error if invalid phone number is entered', async () => {
    // Arrange
    render(<WithContact />)
    // Wait until all async stuff has rendered
    await waitForElementToBeRemoved(() =>
      screen.queryByPlaceholderText('Loading user...'),
    )
    const input = screen.getByLabelText('Mobile number') as HTMLInputElement
    const vfnButton = screen.getByRole('button', { name: 'Verified' })

    // Act
    userEvent.clear(input)
    userEvent.type(input, '12345')
    // Should change to Verify text since contact number has changed.
    expect(vfnButton).toHaveTextContent('Verify')
    userEvent.click(vfnButton)
    await waitFor(() => vfnButton.textContent === 'Verify')

    // Assert
    expect(screen.getByText(INVALID_NUMBER_ERROR_MSG)).toBeInTheDocument()
  })
})

import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { REQUIRED_ERROR } from '~constants/validation'

import * as stories from './ChildrenCompoundField.stories'

const {
  SingleChild,
  DisabledCarriedForward,
  DisabledUnanswered,
  SameNamedLocalAndSponsored,
} = composeStories(stories)

describe('editable children field', () => {
  it('renders error when child name is not selected before submitting', async () => {
    const user = userEvent.setup()
    render(<SingleChild />)
    const submitButton = screen.getByText('Submit')

    await user.click(submitButton)

    const error = screen.getAllByText(REQUIRED_ERROR)
    expect(error.length).toBeGreaterThan(0)
  })
})

describe('same-named child records', () => {
  // Options are virtualised and not rendered in jsdom, so records are picked
  // by keyboard. Records are listed in MyInfo order: SITI RY (local),
  // THRO RY (local), THRO RY (sponsored).
  const pickRecord = async (
    user: ReturnType<typeof userEvent.setup>,
    position: number,
  ) => {
    // The child name dropdown is the first combobox; Child type is the second.
    const input = screen.getAllByRole('combobox')[0]
    await user.click(input)
    await user.type(input, `${'{arrowdown}'.repeat(position + 1)}{enter}`)
  }

  const expectSubmitted = async (childType: string, scope: string) => {
    expect(
      await screen.findByText(
        `You have submitted: ${JSON.stringify([['THRO RY', childType]])}`,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(`Child types: ${JSON.stringify([scope])}`),
    ).toBeInTheDocument()
  }

  it.each([
    { position: 1, childType: 'LOCAL', scope: 'local' },
    { position: 2, childType: 'SPONSORED', scope: 'sponsored' },
  ])(
    'prefills and submits the $scope record when it is selected',
    async ({ position, childType, scope }) => {
      const user = userEvent.setup()
      render(<SameNamedLocalAndSponsored />)

      await pickRecord(user, position)
      await user.click(screen.getByText('Submit'))

      await expectSubmitted(childType, scope)
    },
  )

  it('switches to the other same-named record after one is picked', async () => {
    const user = userEvent.setup()
    render(<SameNamedLocalAndSponsored />)

    await pickRecord(user, 1)
    await pickRecord(user, 2)
    await user.click(screen.getByText('Submit'))

    await expectSubmitted('SPONSORED', 'sponsored')
  })
})

describe('disabled children field (MRF steps 2+ carry-forward)', () => {
  it('displays the carried-forward child name and subfield values as disabled inputs', async () => {
    render(<DisabledCarriedForward />)

    // The child name is displayed even though there is no MyInfo session
    // (myInfoChildrenBirthRecords is undefined on steps 2+). SingleSelect
    // renders the selected label as text, not as the input's value.
    expect(screen.getByText('Phua Chu King')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeDisabled()

    const bcInput = screen.getByDisplayValue('T1234567X')
    expect(bcInput).toBeDisabled()
  })

  it('submits the carried-forward value unchanged', async () => {
    const user = userEvent.setup()
    render(<DisabledCarriedForward />)
    const submitButton = screen.getByText('Submit')

    await user.click(submitButton)

    const success = await screen.findByText(
      `You have submitted: ${JSON.stringify([['Phua Chu King', 'T1234567X']])}`,
    )
    expect(success).not.toBeNull()
  })

  it('renders a disabled blank row when disabled and unanswered', async () => {
    const user = userEvent.setup()
    render(<DisabledUnanswered />)

    // A blank child row is still bootstrapped (disabled means "not editable
    // in this step", not "hide the field body"), rendered as disabled inputs.
    expect(screen.getByRole('combobox')).toBeDisabled()

    // And the (required) field does not block submission, since it is not
    // fillable on this step.
    await user.click(screen.getByText('Submit'))
    const success = await screen.findByText(/You have submitted:/)
    expect(success.textContent).not.toContain('Phua Chu King')
  })
})

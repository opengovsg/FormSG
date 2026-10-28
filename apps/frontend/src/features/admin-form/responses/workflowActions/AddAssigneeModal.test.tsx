import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { AddAssigneeModal } from './AddAssigneeModal'

const REQUIRED =
  'features.adminForm.responses.individualResponse.workflowActions.addAssigneeModal.requiredEmail'

const CONFIRM =
  'features.adminForm.responses.individualResponse.workflowActions.addAssigneeModal.confirm'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { emails?: string }) =>
      values?.emails ? `${key}:${values.emails}` : key,
  }),
}))

const showModal = (onConfirm: (emails: string[]) => void) =>
  render(
    <AddAssigneeModal
      isOpen
      onClose={vi.fn()}
      onConfirm={onConfirm}
      currentAssignees={['lead@agency.gov.sg']}
    />,
  )

const typeEmails = async (text: string) => {
  await userEvent.type(screen.getByRole('textbox'), text)
}

describe('AddAssigneeModal', () => {
  it.each(['', '   ', ',,,', ' , , '])(
    'shows an error instead of submitting an empty email list: %j',
    async (input) => {
      const onConfirm = vi.fn()
      showModal(onConfirm)

      if (input) await typeEmails(input)
      const confirm = screen.getByRole('button', { name: CONFIRM })
      expect(confirm).toBeEnabled()
      await userEvent.click(confirm)

      expect(screen.getByText(REQUIRED)).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-invalid',
        'true',
      )
      expect(onConfirm).not.toHaveBeenCalled()
    },
  )

  it('submits a typed email without a delimiter after correcting an empty field', async () => {
    const onConfirm = vi.fn()
    showModal(onConfirm)
    await userEvent.click(screen.getByRole('button', { name: CONFIRM }))

    expect(screen.getByText(REQUIRED)).toBeInTheDocument()

    await typeEmails('new@agency.gov.sg')
    await userEvent.click(screen.getByRole('button', { name: CONFIRM }))

    expect(screen.queryByText(REQUIRED)).not.toBeInTheDocument()
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledWith(['new@agency.gov.sg'])
  })

  it('clears the empty-field error when the modal is reopened', async () => {
    const onConfirm = vi.fn()
    const { rerender } = showModal(onConfirm)
    await userEvent.click(screen.getByRole('button', { name: CONFIRM }))
    expect(screen.getByText(REQUIRED)).toBeInTheDocument()

    const props = {
      onClose: vi.fn(),
      onConfirm,
      currentAssignees: ['lead@agency.gov.sg'],
    }
    rerender(<AddAssigneeModal {...props} isOpen={false} />)
    rerender(<AddAssigneeModal {...props} isOpen />)

    expect(screen.queryByText(REQUIRED)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: CONFIRM })).toBeEnabled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('does not show a notification summary', () => {
    showModal(vi.fn())

    expect(
      screen.queryByText(
        'features.adminForm.responses.individualResponse.workflowActions.whoIsNotifiedLabel',
      ),
    ).not.toBeInTheDocument()
  })

  it('adds new people, lowercased', async () => {
    const onConfirm = vi.fn()
    showModal(onConfirm)

    await typeEmails('New@agency.gov.sg,')
    await userEvent.click(screen.getByRole('button', { name: CONFIRM }))

    expect(onConfirm).toHaveBeenCalledWith(['new@agency.gov.sg'])
  })

  it('blocks someone already on the step', async () => {
    const onConfirm = vi.fn()
    showModal(onConfirm)

    await typeEmails('Lead@agency.gov.sg,')

    expect(screen.getByText(/lead@agency\.gov\.sg/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: CONFIRM })).toBeDisabled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('adds more than two people at once', async () => {
    const onConfirm = vi.fn()
    showModal(onConfirm)

    await typeEmails('a@agency.gov.sg,b@agency.gov.sg,c@agency.gov.sg,')
    await userEvent.click(screen.getByRole('button', { name: CONFIRM }))

    expect(onConfirm).toHaveBeenCalledWith([
      'a@agency.gov.sg',
      'b@agency.gov.sg',
      'c@agency.gov.sg',
    ])
  })
})

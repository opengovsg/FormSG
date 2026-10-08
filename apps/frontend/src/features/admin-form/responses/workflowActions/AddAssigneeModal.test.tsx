import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { AddAssigneeModal } from './AddAssigneeModal'

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
})

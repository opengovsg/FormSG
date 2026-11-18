import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { StopWorkflowModal } from './StopWorkflowModal'

const INVALID =
  'features.adminForm.responses.individualResponse.workflowActions.addAssigneeModal.invalidEmail'

const CONFIRM =
  'features.adminForm.responses.individualResponse.workflowActions.stopModal.confirm'

let mockSettingsEmails: string[] | undefined

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('~features/admin-form/settings/queries', () => ({
  useAdminFormSettings: () => ({
    data: mockSettingsEmails ? { emails: mockSettingsEmails } : undefined,
  }),
}))

const showModal = (onConfirm: (emails: string[]) => void) =>
  render(<StopWorkflowModal isOpen onClose={vi.fn()} onConfirm={onConfirm} />)

const typeEmails = async (text: string) => {
  await userEvent.type(screen.getByRole('textbox'), text)
}

describe('StopWorkflowModal', () => {
  beforeEach(() => {
    mockSettingsEmails = undefined
  })

  it("prefills the form's notification emails and sends them on stop", async () => {
    mockSettingsEmails = ['records@agency.gov.sg']
    const onConfirm = vi.fn()
    showModal(onConfirm)

    expect(screen.getByText('records@agency.gov.sg')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: CONFIRM }))

    expect(onConfirm).toHaveBeenCalledWith(['records@agency.gov.sg'])
  })

  it('stops without notifying anyone when the field is empty', async () => {
    const onConfirm = vi.fn()
    showModal(onConfirm)

    await userEvent.click(screen.getByRole('button', { name: CONFIRM }))

    expect(onConfirm).toHaveBeenCalledWith([])
  })

  it('lowercases and dedupes typed emails', async () => {
    const onConfirm = vi.fn()
    showModal(onConfirm)

    await typeEmails('Lead@Agency.gov.sg,lead@agency.gov.sg,')
    await userEvent.click(screen.getByRole('button', { name: CONFIRM }))

    expect(onConfirm).toHaveBeenCalledWith(['lead@agency.gov.sg'])
  })

  it('shows the Assign error and blocks stopping for an invalid email', async () => {
    const onConfirm = vi.fn()
    showModal(onConfirm)

    await typeEmails('not-an-email,')

    expect(screen.getByText(INVALID)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: CONFIRM })).toBeDisabled()
  })
})

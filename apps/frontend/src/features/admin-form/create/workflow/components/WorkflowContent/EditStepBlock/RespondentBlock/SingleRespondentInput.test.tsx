import { useForm } from 'react-hook-form'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { WorkflowType } from 'formsg-shared/types'

import { EditStepInputs } from '../../../../types'

import { SingleRespondentInput } from './SingleRespondentInput'

vi.mock('~features/admin-form/create/common/useAddFieldPicker', () => ({
  useAddFieldPicker: () => ({ withAddFieldAction: () => () => undefined }),
}))
vi.mock('../../../../hooks/useIsWorkflowSavePermissive', () => ({
  useIsWorkflowSavePermissive: () => false,
}))
const onSave = vi.fn()

vi.mock('./Components/ConditionalRoutingOption', () => ({
  ConditionalRoutingOption: () => <div>Configure routing emails</div>,
}))
const Harness = () => {
  const form = useForm<EditStepInputs>({
    defaultValues: { workflow_type: WorkflowType.Static, emails: [], edit: [] },
  })
  return (
    <form onSubmit={form.handleSubmit(onSave)}>
      <SingleRespondentInput
        formMethods={form}
        isLoading={false}
        emailFields={[{ value: 'email', label: '2. Approver email' }]}
        dropdownFields={[]}
      />
      <output data-testid="draft">{JSON.stringify(form.watch())}</output>
      <button type="submit">Save</button>
    </form>
  )
}

describe('single respondent input', () => {
  it('adds comma-separated addresses and switches to a field without keeping the old source', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'one@agency.gov.sg,two@agency.gov.sg{Enter}')
    expect(JSON.parse(screen.getByTestId('draft').textContent!).emails).toEqual(
      ['one@agency.gov.sg', 'two@agency.gov.sg'],
    )
    await user.type(input, 'Approver{Enter}')
    const draft = JSON.parse(screen.getByTestId('draft').textContent!)
    expect(draft.workflow_type).toBe(WorkflowType.Dynamic)
    expect(draft.field).toBe('email')
    expect(draft.emails).toEqual([])
    await user.click(
      screen.getByRole('button', { name: 'Clear selected respondent' }),
    )
    expect(JSON.parse(screen.getByTestId('draft').textContent!).field).toBe('')
  })
  it('rejects an invalid email without committing it', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByRole('combobox'), 'bad@email{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter valid email addresses',
    )
    expect(JSON.parse(screen.getByTestId('draft').textContent!).emails).toEqual(
      [],
    )
  })
})

it('does not save an unfinished query or an empty static source, and saves a valid email on blur', async () => {
  onSave.mockClear()
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(onSave).not.toHaveBeenCalled()
  await user.type(screen.getByRole('combobox'), 'unfinished')
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(onSave).not.toHaveBeenCalled()
  await user.clear(screen.getByRole('combobox'))
  await user.type(screen.getByRole('combobox'), 'valid@agency.gov.sg')
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(onSave).toHaveBeenCalledTimes(1)
  expect(onSave.mock.calls[0][0].emails).toEqual(['valid@agency.gov.sg'])
  await user.click(
    screen.getByRole('button', { name: 'Remove valid@agency.gov.sg' }),
  )
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(onSave).toHaveBeenCalledTimes(1)
})

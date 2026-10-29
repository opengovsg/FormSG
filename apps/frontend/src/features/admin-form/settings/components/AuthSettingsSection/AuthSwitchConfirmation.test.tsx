import { fireEvent, render, screen } from '@testing-library/react'

import {
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormFieldDto,
  StepLoginAuthType,
} from 'formsg-shared/types'

import { AuthSwitchConfirmation } from './AuthSwitchConfirmation'

const formFields = [
  {
    _id: 'intro',
    title: '',
    description: 'Introduction',
    fieldType: BasicField.Statement,
  },
  { _id: 'name', title: 'Requester name', fieldType: BasicField.ShortText },
  {
    _id: 'uen',
    title: 'Organisation UEN',
    fieldType: BasicField.Uen,
    corppass: { attr: CorppassAttribute.Uen },
  },
] as FormFieldDto[]
const setup = (
  deleteFields = true,
  nextAuthType: StepLoginAuthType = FormAuthType.MyInfo,
) => {
  const onClose = vi.fn()
  const onConfirm = vi.fn()
  render(
    <AuthSwitchConfirmation
      currentAuthType={FormAuthType.CP}
      nextAuthType={nextAuthType}
      fields={[formFields[2]]}
      formFields={formFields}
      deleteFields={deleteFields}
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  )
  return { onClose, onConfirm }
}
it('explains last-provider deletion and uses the actual form question number in a field badge', () => {
  const { onClose, onConfirm } = setup()
  expect(screen.getByText('Switch to Singpass')).toBeInTheDocument()
  expect(
    screen.getByText(/This is the only step using Corppass/),
  ).toBeInTheDocument()
  expect(screen.getByText(/^2\. Organisation UEN/)).toBeInTheDocument()
  expect(
    screen.getByText(
      /deleted from your form when you save this step or navigate away/,
    ),
  ).toBeInTheDocument()
  expect(screen.getByText(/Past responses will be kept/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(onClose).toHaveBeenCalledTimes(1)
  expect(onConfirm).not.toHaveBeenCalled()
})
it('distinguishes unassignment from deleting field definitions', () => {
  const { onConfirm } = setup(false)
  expect(screen.getByText(/unassigned from this step/)).toHaveTextContent(
    'They will stay in your form.',
  )
  expect(screen.queryByText(/deleted from your form/)).not.toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Unassign fields and switch to Singpass',
    }),
  )
  expect(onConfirm).toHaveBeenCalledTimes(1)
})
it('uses a statement for the turn-off header', () => {
  setup(true, FormAuthType.NIL)
  expect(screen.getByText('Turn off authentication')).toBeInTheDocument()
  expect(screen.queryByText('Turn off authentication?')).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Delete fields and turn off' }),
  ).toBeInTheDocument()
})

import { useForm } from 'react-hook-form'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  BasicField,
  FormAuthType,
  MyInfoAttribute,
  WorkflowType,
} from 'formsg-shared/types'

import { EditStepInputs } from '../../../types'

import { QuestionsBlock } from './QuestionsBlock'

vi.mock('./EditStepBlock', () => ({
  APPROVAL_FIELD_NAME: 'approval_field',
  FIELDS_TO_EDIT_NAME: 'edit',
}))

const fields = [
  {
    _id: 'plain',
    title: 'Comments',
    questionNumber: 1,
    fieldType: BasicField.ShortText,
  },
  {
    _id: 'name',
    title: 'Myinfo name',
    questionNumber: 2,
    fieldType: BasicField.ShortText,
    myInfo: { attr: MyInfoAttribute.Name },
  },
  {
    _id: 'owned',
    title: 'First person name',
    questionNumber: 3,
    fieldType: BasicField.ShortText,
    myInfo: { attr: MyInfoAttribute.Name },
  },
  {
    _id: 'company',
    title: 'Company',
    questionNumber: 4,
    fieldType: BasicField.ShortText,
    corppass: { attr: 'uen' },
  },
]
vi.mock('~features/admin-form/common/queries', () => ({
  useAdminForm: () => ({ data: { authType: FormAuthType.MyInfo } }),
}))
vi.mock('../../../hooks/useAdminFormWorkflow', () => ({
  useAdminFormWorkflow: () => ({
    formFields: fields,
    formWorkflow: [
      { edit: ['owned'] },
      { edit: ['plain', 'company'], auth: { auth_type: FormAuthType.CP } },
    ],
    idToFieldMap: Object.fromEntries(fields.map((f) => [f._id, f])),
  }),
}))
vi.mock('../../../hooks/useIsWorkflowBuilderRedesign', () => ({
  useIsWorkflowBuilderRedesign: () => true,
}))
vi.mock('../../../hooks/useIsStepLoginShown', () => ({
  useIsStepLoginShown: () => true,
}))
vi.mock('~features/admin-form/create/common/useAddFieldPicker', () => ({
  useAddFieldPicker: () => ({
    withAddFieldItem: (x: unknown) => x,
    withAddFieldAction: (fn: unknown) => fn,
  }),
}))
vi.mock('~components/Dropdown', () => ({
  MultiSelect: ({
    items,
    values,
    onChange,
  }: {
    items: {
      value: string
      label: string
      disabled?: boolean
      descriptionTag?: string
    }[]
    values: string[]
    onChange: (v: string[]) => void
  }) => (
    <div>
      {items.map((item) => (
        <button
          key={item.value}
          disabled={item.disabled}
          onClick={() => onChange([...values, item.value])}
        >
          {item.label}
          {item.descriptionTag}
        </button>
      ))}
    </div>
  ),
}))

const Harness = ({ hasLogin = true }: { hasLogin?: boolean }) => {
  const form = useForm<EditStepInputs>({
    defaultValues: {
      edit: hasLogin ? ['plain', 'company'] : ['plain'],
      auth: hasLogin ? { auth_type: FormAuthType.CP } : undefined,
      workflow_type: WorkflowType.Static,
    },
  })
  return (
    <>
      <QuestionsBlock formMethods={form} stepNumber={1} isLoading={false} />
      <output data-testid="draft">{JSON.stringify(form.watch())}</output>
    </>
  )
}

describe('proposed login-field assignment', () => {
  it('keeps fields owned by another step visible and disabled', () => {
    render(<Harness />)
    expect(
      screen.getByRole('button', {
        name: /First person name.*Assigned to Step 1/,
      }),
    ).toBeDisabled()
  })
  it('cancels without changing the draft, then switches login and unassigns only incompatible fields on confirmation', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const before = screen.getByTestId('draft').textContent
    await user.click(screen.getByRole('button', { name: /2. Myinfo name/ }))
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'They will remain in your form',
    )
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByTestId('draft').textContent).toBe(before)
    await user.click(screen.getByRole('button', { name: /2. Myinfo name/ }))
    await user.click(
      screen.getByRole('button', {
        name: 'Unassign fields and switch to Singpass',
      }),
    )
    const draft = JSON.parse(screen.getByTestId('draft').textContent!)
    expect(draft.edit).toEqual(['plain', 'name'])
    expect(draft.auth.auth_type).toBe(FormAuthType.MyInfo)
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })
})

it('enables login and assigns the requested field together in the step draft', async () => {
  const user = userEvent.setup()
  render(<Harness hasLogin={false} />)
  await user.click(screen.getByRole('button', { name: /2. Myinfo name/ }))
  expect(screen.getByRole('dialog')).toHaveTextContent('Step 2 uses no login')
  await user.click(
    screen.getByRole('button', { name: 'Enable Singpass and assign field' }),
  )
  const draft = JSON.parse(screen.getByTestId('draft').textContent!)
  expect(draft.edit).toEqual(['plain', 'name'])
  expect(draft.auth.auth_type).toBe(FormAuthType.MyInfo)
})

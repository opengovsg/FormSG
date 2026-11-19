import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ITEM_CHECKBOX_TEST_ID } from '~components/Dropdown/components/MultiDropdownItem/ItemCheckboxIcon'

import { EmailSources } from './emailSource'
import { EmailSourceInput, EmailSourceInputProps } from './EmailSourceInput'

const FIELDS: EmailSourceInputProps['fields'] = [
  { kind: 'emailField', fieldId: 'manager', label: '1. Manager email' },
  { kind: 'dropdownField', fieldId: 'department', label: '2. Department' },
]

const NONE: EmailSources = { emails: [], emailFields: [], dropdownFields: [] }

const renderInput = (
  initial: EmailSources,
  props: Partial<EmailSourceInputProps> = {},
) => {
  const onChange = vi.fn()
  const Harness = () => {
    const [value, setValue] = useState(initial)
    return (
      <EmailSourceInput
        name="respondent-source"
        value={value}
        onChange={(next) => {
          onChange(next)
          setValue(next)
        }}
        fields={FIELDS}
        {...props}
      />
    )
  }
  render(<Harness />)
  return { onChange, input: screen.getByRole('combobox') }
}

describe('EmailSourceInput', () => {
  it('adds a typed email on Enter', async () => {
    const { onChange, input } = renderInput(NONE)

    await userEvent.type(input, 'jane@agency.gov.sg{Enter}')

    expect(onChange).toHaveBeenLastCalledWith({
      ...NONE,
      emails: ['jane@agency.gov.sg'],
    })
  })

  it('keeps typed emails when the admin clicks away, one tag each', async () => {
    const { onChange, input } = renderInput({
      ...NONE,
      emails: ['jane@agency.gov.sg'],
      emailFields: ['manager'],
    })

    await userEvent.type(input, 'bob@agency.gov.sg, amy.agency.gov.sg,')
    await userEvent.click(document.body)

    expect(onChange).toHaveBeenLastCalledWith({
      ...NONE,
      emailFields: ['manager'],
      emails: ['jane@agency.gov.sg', 'bob@agency.gov.sg', 'amy.agency.gov.sg'],
    })
  })

  it('shows an invalid email as a red tag', () => {
    renderInput({ ...NONE, emails: ['bob@agency'] })

    expect(screen.getByTitle('bob@agency')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('adds a field picked from its kind beside the menu', async () => {
    const { onChange } = renderInput({
      ...NONE,
      emails: ['jane@agency.gov.sg'],
    })

    await userEvent.click(
      screen.getByRole('button', { name: /Open dropdown options/ }),
    )
    await userEvent.click(
      screen.getByRole('option', { name: /Dropdown field/ }),
    )
    const panel = screen.getByRole('group', { name: 'Dropdown field' })
    expect(within(panel).getAllByTestId(ITEM_CHECKBOX_TEST_ID)).toHaveLength(1)
    await userEvent.click(
      within(panel).getByRole('option', { name: /2. Department/ }),
    )

    expect(onChange).toHaveBeenLastCalledWith({
      ...NONE,
      emails: ['jane@agency.gov.sg'],
      dropdownFields: ['department'],
    })
  })

  it('runs an add-field action without changing the value', async () => {
    const onSelect = vi.fn()
    const { onChange } = renderInput(NONE, {
      addFieldActions: {
        emailField: { label: 'Add an Email field', onSelect },
      },
    })

    await userEvent.click(
      screen.getByRole('button', { name: /Open dropdown options/ }),
    )
    await userEvent.click(screen.getByRole('option', { name: /Email field/ }))
    await userEvent.click(
      screen.getByRole('option', { name: /Add an Email field/ }),
    )

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
  })
})

import { screen } from '@testing-library/react'

import { BasicField } from 'formsg-shared/types/field'

import { render } from '~/test-utils'

import { ShortTextField } from '~templates/Field'

import { FormFieldWithQuestionNo } from '~features/form/types'

import { FieldFactory } from './FieldFactory'

vi.mock('~features/public-form/PublicFormContext', () => ({
  usePublicFormContext: () => ({
    myInfoChildrenBirthRecords: undefined,
    form: undefined,
  }),
}))

vi.mock('~templates/Field', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~templates/Field')>()
  return {
    ...actual,
    ShortTextField: vi.fn(
      (props: {
        schema: { disabled?: boolean }
        isHighContrast?: boolean
        disableRequiredValidation?: boolean
      }) => (
        <div
          data-testid="mock-short-text-field"
          data-disabled={String(props.schema.disabled)}
          data-high-contrast={String(props.isHighContrast)}
          data-disable-required-validation={String(
            props.disableRequiredValidation,
          )}
        />
      ),
    ),
  }
})

const mockShortTextField = vi.mocked(ShortTextField)

const baseField = {
  _id: '507f1f77bcf86cd799439011',
  fieldType: BasicField.ShortText,
  title: 'Test field',
  description: '',
  required: true,
  disabled: false,
  questionNumber: 1,
} as unknown as FormFieldWithQuestionNo

describe('FieldFactory', () => {
  beforeEach(() => {
    mockShortTextField.mockClear()
  })

  it('re-renders when only the disabled state changes', () => {
    const { rerender } = render(
      <FieldFactory
        field={baseField}
        isHighContrast={false}
        disableRequiredValidation={false}
      />,
    )
    expect(mockShortTextField).toHaveBeenCalledTimes(1)

    rerender(
      <FieldFactory
        field={{ ...baseField, disabled: true }}
        isHighContrast={true}
        disableRequiredValidation={true}
      />,
    )

    expect(mockShortTextField).toHaveBeenCalledTimes(2)
    const el = screen.getByTestId('mock-short-text-field')
    expect(el).toHaveAttribute('data-disabled', 'true')
    expect(el).toHaveAttribute('data-high-contrast', 'true')
    expect(el).toHaveAttribute('data-disable-required-validation', 'true')
  })

  it('does not re-render for a new field object with the same render keys', () => {
    const { rerender } = render(
      <FieldFactory
        field={baseField}
        isHighContrast={false}
        disableRequiredValidation={false}
      />,
    )

    rerender(
      <FieldFactory
        field={{ ...baseField }}
        isHighContrast={false}
        disableRequiredValidation={false}
      />,
    )

    expect(mockShortTextField).toHaveBeenCalledTimes(1)
  })
})

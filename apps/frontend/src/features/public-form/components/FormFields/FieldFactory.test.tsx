import { screen } from '@testing-library/react'

import { BasicField } from 'formsg-shared/types/field'

import { render } from '~/test-utils'

import { FormFieldWithQuestionNo } from '~features/form/types'

import { FieldFactory } from './FieldFactory'

vi.mock('~features/public-form/PublicFormContext', () => ({
  usePublicFormContext: () => ({
    myInfoChildrenBirthRecords: undefined,
    form: undefined,
  }),
}))

// Stub out the real field component so assertions can inspect exactly what
// FieldFactory forwards to it, without needing a react-hook-form tree.
vi.mock('~templates/Field', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~templates/Field')>()
  return {
    ...actual,
    ShortTextField: (props: {
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
  }
})

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
  it('re-renders to reflect disabled/isHighContrast/disableRequiredValidation when they change but _id and questionNumber do not', () => {
    const { rerender } = render(
      <FieldFactory
        field={baseField}
        isHighContrast={false}
        disableRequiredValidation={false}
      />,
    )

    rerender(
      <FieldFactory
        field={{ ...baseField, disabled: true }}
        isHighContrast={true}
        disableRequiredValidation={true}
      />,
    )

    const el = screen.getByTestId('mock-short-text-field')
    expect(el).toHaveAttribute('data-disabled', 'true')
    expect(el).toHaveAttribute('data-high-contrast', 'true')
    expect(el).toHaveAttribute('data-disable-required-validation', 'true')
  })

  it('does not re-render when field, isHighContrast, and disableRequiredValidation are unchanged', () => {
    const { rerender } = render(
      <FieldFactory
        field={baseField}
        isHighContrast={false}
        disableRequiredValidation={false}
      />,
    )
    const firstRenderNode = screen.getByTestId('mock-short-text-field')

    rerender(
      <FieldFactory
        field={{ ...baseField }}
        isHighContrast={false}
        disableRequiredValidation={false}
      />,
    )

    expect(screen.getByTestId('mock-short-text-field')).toBe(firstRenderNode)
  })
})

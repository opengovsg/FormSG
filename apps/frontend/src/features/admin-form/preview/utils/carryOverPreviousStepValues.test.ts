import { BasicField, FormFieldDto } from 'formsg-shared/types'

import { FormFieldValues } from '~templates/Field'

import { carryOverPreviousStepValues } from './carryOverPreviousStepValues'

const field = (_id: string): FormFieldDto =>
  ({ _id, fieldType: BasicField.ShortText }) as FormFieldDto

const step = (edit: string[]) =>
  ({ edit }) as unknown as Parameters<
    typeof carryOverPreviousStepValues
  >[0]['currentStepNumberWorkflowStep']

const fields = [field('a'), field('b')]

describe('carryOverPreviousStepValues', () => {
  it('keeps the entered value for a field this step cannot edit', () => {
    expect(
      carryOverPreviousStepValues({
        augmentedFormFields: fields,
        currentStepNumberWorkflowStep: step(['b']),
        enteredValues: { a: 'from step 1', b: 'stale' },
        defaultFormValues: {},
      }),
    ).toEqual({ a: 'from step 1' })
  })

  it('resets a field this step can edit back to its default', () => {
    expect(
      carryOverPreviousStepValues({
        augmentedFormFields: fields,
        currentStepNumberWorkflowStep: step(['b']),
        enteredValues: { b: 'typed on an earlier step' },
        defaultFormValues: { b: 'prefilled' },
      }),
    ).toEqual({ b: 'prefilled' })
  })

  it('leaves an uneditable field absent when nothing was entered for it', () => {
    expect(
      carryOverPreviousStepValues({
        augmentedFormFields: fields,
        currentStepNumberWorkflowStep: step(['b']),
        enteredValues: {},
        defaultFormValues: {},
      }),
    ).toEqual({})
  })

  it('carries over a falsy entered value rather than dropping it', () => {
    expect(
      carryOverPreviousStepValues({
        augmentedFormFields: fields,
        currentStepNumberWorkflowStep: step(['b']),
        enteredValues: { a: '' },
        defaultFormValues: { a: 'default' },
      }),
    ).toEqual({ a: '' })
  })

  it('keeps every default when there is no workflow step', () => {
    const defaultFormValues: FormFieldValues = {
      a: 'default a',
      b: 'default b',
    }
    expect(
      carryOverPreviousStepValues({
        augmentedFormFields: fields,
        currentStepNumberWorkflowStep: undefined,
        enteredValues: { a: 'entered', b: 'entered' },
        defaultFormValues,
      }),
    ).toEqual(defaultFormValues)
  })
})

import { BasicField, FormFieldDto } from 'formsg-shared/types'

import { carryOverPreviousStepValues } from './carryOverPreviousStepValues'

const field = (_id: string): FormFieldDto =>
  ({ _id, fieldType: BasicField.ShortText }) as FormFieldDto

type Args = Parameters<typeof carryOverPreviousStepValues>[0]
const step = (edit: string[]) =>
  ({ edit }) as unknown as Args['precedingWorkflowSteps'][number]

// A three step approval form: step 1 fills `reason`, step 2 `comments`,
// step 3 `approval`.
const fields = [field('reason'), field('comments'), field('approval')]
const stepOne = step(['reason'])
const stepTwo = step(['comments'])

describe('carryOverPreviousStepValues', () => {
  it("carries an earlier step's answer forward", () => {
    expect(
      carryOverPreviousStepValues({
        augmentedFormFields: fields,
        precedingWorkflowSteps: [stepOne],
        enteredValues: { reason: 'New laptop' },
        defaultFormValues: {},
      }),
    ).toEqual({ reason: 'New laptop' })
  })

  it("does not carry a later step's answer backwards", () => {
    // Viewing step 1, having typed into step 3 earlier. A step 1 respondent has
    // never seen `approval`, so it must not appear even though step 1 cannot
    // edit it.
    expect(
      carryOverPreviousStepValues({
        augmentedFormFields: fields,
        precedingWorkflowSteps: [],
        enteredValues: { approval: 'Approved' },
        defaultFormValues: {},
      }),
    ).toEqual({})
  })

  it('carries every preceding step, not just the immediately previous one', () => {
    expect(
      carryOverPreviousStepValues({
        augmentedFormFields: fields,
        precedingWorkflowSteps: [stepOne, stepTwo],
        enteredValues: { reason: 'New laptop', comments: 'Looks fine' },
        defaultFormValues: {},
      }),
    ).toEqual({ reason: 'New laptop', comments: 'Looks fine' })
  })

  it('resets a field this step fills in, even if an entered value exists', () => {
    expect(
      carryOverPreviousStepValues({
        augmentedFormFields: fields,
        precedingWorkflowSteps: [stepOne],
        enteredValues: { reason: 'New laptop', comments: 'typed earlier' },
        defaultFormValues: { comments: 'prefilled' },
      }),
    ).toEqual({ reason: 'New laptop', comments: 'prefilled' })
  })

  it('keeps an entered value for a field an earlier step shares with this one', () => {
    // `reason` is editable at both step 1 and step 2; a step 2 respondent sees
    // step 1's answer and may revise it.
    expect(
      carryOverPreviousStepValues({
        augmentedFormFields: fields,
        precedingWorkflowSteps: [stepOne],
        enteredValues: { reason: 'New laptop' },
        defaultFormValues: { reason: '' },
      }),
    ).toEqual({ reason: 'New laptop' })
  })

  it('carries a falsy entered value rather than dropping it', () => {
    expect(
      carryOverPreviousStepValues({
        augmentedFormFields: fields,
        precedingWorkflowSteps: [stepOne],
        enteredValues: { reason: '' },
        defaultFormValues: { reason: 'default' },
      }),
    ).toEqual({ reason: '' })
  })

  it('leaves a field absent when nothing was entered for it', () => {
    expect(
      carryOverPreviousStepValues({
        augmentedFormFields: fields,
        precedingWorkflowSteps: [stepOne],
        enteredValues: {},
        defaultFormValues: {},
      }),
    ).toEqual({})
  })

  it('keeps every default at the first step, which has no preceding steps', () => {
    expect(
      carryOverPreviousStepValues({
        augmentedFormFields: fields,
        precedingWorkflowSteps: [],
        enteredValues: { reason: 'entered', comments: 'entered' },
        defaultFormValues: { reason: 'default' },
      }),
    ).toEqual({ reason: 'default' })
  })
})

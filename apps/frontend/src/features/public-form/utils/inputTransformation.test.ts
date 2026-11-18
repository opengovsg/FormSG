import { BasicField, FormFieldDto } from 'formsg-shared/types'

import { FormFieldValue } from '~templates/Field'

import { transformInputsToOutputs } from './inputTransformation'

const childrenField = {
  _id: 'c'.repeat(24),
  title: 'Children',
  fieldType: BasicField.Children,
  childrenSubFields: ['childname', 'childbirthcertno', 'childvaxxstatus'],
} as unknown as FormFieldDto

describe('transformInputsToOutputs', () => {
  it('pads short children rows to the subfield count with empty strings', () => {
    // Disabled subfield inputs never register values in react-hook-form, so a
    // bootstrapped row can be shorter than childrenSubFields. The output must
    // still be a dense string[][] or response validation rejects it.
    const output = transformInputsToOutputs(childrenField, {
      child: [['']],
      childFields: ['childname', 'childbirthcertno', 'childvaxxstatus'],
    } as unknown as FormFieldValue<BasicField.Children>)

    expect(output).toMatchObject({ answerArray: [['', '', '']] })
  })

  it('fills undefined holes in children rows with empty strings', () => {
    const output = transformInputsToOutputs(childrenField, {
      child: [[undefined, 'T1234567X', undefined]],
      childFields: ['childname', 'childbirthcertno', 'childvaxxstatus'],
    } as unknown as FormFieldValue<BasicField.Children>)

    expect(output).toMatchObject({ answerArray: [['', 'T1234567X', '']] })
  })
})

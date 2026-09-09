import { getWorkflowStepLabel } from './getWorkflowStepLabel'

describe('getWorkflowStepLabel', () => {
  it.each<[string, number, string | undefined, string, string]>([
    [
      'the name the admin gave',
      2,
      'Approval by manager',
      'step',
      'Approval by manager',
    ],
    [
      'the position, 1-indexed, with the translated word capitalised',
      0,
      undefined,
      'langkah',
      'Langkah 1',
    ],
    ['the position when the name is empty', 1, '', 'step', 'Step 2'],
  ])('should use %s', (_name, stepNumber, stepName, stepWord, expected) => {
    expect(getWorkflowStepLabel({ stepNumber, stepName, stepWord })).toEqual(
      expected,
    )
  })
})

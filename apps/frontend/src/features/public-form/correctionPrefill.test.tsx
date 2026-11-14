import {
  BasicField,
  FormFieldDto,
  FormResponseMode,
  WorkflowType,
} from 'formsg-shared/types'

import { DecryptedSubmission } from './utils/decryptSubmission'
import { getInitialFormValues } from './PublicFormProvider'

const fields = ['earlier', 'target', 'later'].map((_id) => ({
  _id,
  fieldType: BasicField.ShortText,
  title: _id,
})) as FormFieldDto[]
const previousSubmission = {
  correctionClearFieldIds: ['target'],
  responses: Object.fromEntries(
    fields.map(({ _id }) => [
      _id,
      {
        fieldType: BasicField.ShortText,
        answer: { value: `${_id} answer` },
      },
    ]),
  ),
} as unknown as DecryptedSubmission

const initialValues = (previous = previousSubmission) =>
  getInitialFormValues({
    formResponseMode: FormResponseMode.Multirespondent,
    previousSubmission: previous,
    currentStepNumberWorkflowStep: {
      _id: 'target-step',
      workflow_type: WorkflowType.Static,
      edit: ['target'],
    },
    augmentedFormFields: fields,
    fieldPrefillMap: {},
    draftResponsesToRestore: { target: 'stale draft' },
    searchParams: new URLSearchParams(),
    isSaveDraftEnabled: true,
  })

describe('correction prefills', () => {
  it('starts target fields empty on each load while keeping other steps and authoritative answers', () => {
    expect(initialValues()).toMatchObject({
      earlier: 'earlier answer',
      later: 'later answer',
    })
    expect(initialValues()).toHaveProperty('target', '')
    expect(previousSubmission.responses.target.answer).toEqual({
      value: 'target answer',
    })
  })
  it('initializes cleared tables with their required blank rows', () => {
    const table = {
      _id: 'target',
      fieldType: BasicField.Table,
      minimumRows: 2,
      columns: [{ _id: 'column', columnType: BasicField.ShortText }],
    } as unknown as FormFieldDto
    const values = getInitialFormValues({
      formResponseMode: FormResponseMode.Multirespondent,
      previousSubmission,
      currentStepNumberWorkflowStep: {
        _id: 'target-step',
        workflow_type: WorkflowType.Static,
        edit: ['target'],
      },
      augmentedFormFields: [table],
      fieldPrefillMap: {},
      draftResponsesToRestore: {},
      searchParams: new URLSearchParams(),
      isSaveDraftEnabled: false,
    })
    expect(values.target).toHaveLength(2)
  })
  it('keeps existing behavior when no correction clearing is requested', () => {
    expect(
      initialValues({
        ...previousSubmission,
        correctionClearFieldIds: undefined,
      }),
    ).toHaveProperty('target', 'stale draft')
  })
})

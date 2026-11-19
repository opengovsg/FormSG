import { WorkflowType } from 'formsg-shared/types'

import {
  emailSourcesToNarrowestStep,
  stepToEmailSources,
} from './stepRecipients'

const EMAIL = 'ops@agency.gov.sg'

describe('emailSourcesToNarrowestStep', () => {
  it.each([
    [
      'only typed emails as static',
      { emails: [EMAIL], emailFields: [], dropdownFields: [] },
      WorkflowType.Static,
    ],
    [
      'nothing as static',
      { emails: [], emailFields: [], dropdownFields: [] },
      WorkflowType.Static,
    ],
    [
      'one Email field as dynamic',
      { emails: [], emailFields: ['f1'], dropdownFields: [] },
      WorkflowType.Dynamic,
    ],
    [
      'one Dropdown as conditional',
      { emails: [], emailFields: [], dropdownFields: ['d1'] },
      WorkflowType.Conditional,
    ],
    [
      'an email and a field as hybrid',
      { emails: [EMAIL], emailFields: ['f1'], dropdownFields: [] },
      WorkflowType.Hybrid,
    ],
    [
      'two Email fields as hybrid',
      { emails: [], emailFields: ['f1', 'f2'], dropdownFields: [] },
      WorkflowType.Hybrid,
    ],
  ])('saves %s', (_name, sources, workflowType) => {
    expect(emailSourcesToNarrowestStep(sources).workflow_type).toBe(
      workflowType,
    )
  })

  it('round-trips every source through a step', () => {
    const sources = {
      emails: [EMAIL],
      emailFields: ['f1', 'f2'],
      dropdownFields: ['d1', 'd2'],
    }

    expect(stepToEmailSources(emailSourcesToNarrowestStep(sources))).toEqual(
      sources,
    )
  })
})

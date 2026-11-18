import { BasicField } from 'formsg-shared/types'

import { ParsedClearFormFieldResponsesV4 } from 'src/types/api'

import { resolveMrfMyInfoReadOnlyFields } from '../myinfo-read-only-fields'

const responses = Object.fromEntries(
  ['name', 'mobile', 'plain', 'children'].map((id) => [
    id,
    { fieldType: BasicField.ShortText, answer: { value: 'answer' } },
  ]),
) as ParsedClearFormFieldResponsesV4

describe('resolveMrfMyInfoReadOnlyFields', () => {
  it('includes only submitted fields with verified field IDs', () => {
    expect(
      resolveMrfMyInfoReadOnlyFields({
        verifiedKeys: new Set(['name', 'hidden']),
        responses,
      }),
    ).toEqual(['name'])
  })

  it('resolves composite child verification keys to their Children field ID', () => {
    expect(
      resolveMrfMyInfoReadOnlyFields({
        verifiedKeys: new Set([
          'childrenbirthrecords.children.childname.0.CHILD',
        ]),
        responses,
      }),
    ).toEqual(['children'])
  })

  it('ignores composite child keys of fields that were not submitted', () => {
    expect(
      resolveMrfMyInfoReadOnlyFields({
        verifiedKeys: new Set([
          'childrenbirthrecords.notsubmitted.childname.0.CHILD',
        ]),
        responses,
      }),
    ).toEqual([])
  })

  it('returns no field IDs when verification succeeded with no verified keys', () => {
    expect(
      resolveMrfMyInfoReadOnlyFields({ verifiedKeys: new Set(), responses }),
    ).toEqual([])
  })
})

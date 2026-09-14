import { ObjectId } from 'bson'
import {
  BasicField,
  MyInfoAttribute,
  MyInfoChildAttributes,
  MyInfoChildData,
} from 'formsg-shared/types'

import { FormFieldSchema, IHashes } from 'src/types'
import { PossiblyPrefilledField } from 'src/types/field/myinfoField'

import { ParsedClearFormFieldResponsesV4 } from '../../../../../types/api'
import {
  compareHashedValues,
  getMyInfoChildHashKey,
  hashFieldValues,
} from '../../../myinfo/myinfo.util'
import { adaptV4ResponsesForMyInfoHashCheck } from '../multirespondent-submission.utils'

/**
 * End-to-end parity check for MRF Children hash verification: hashes are
 * produced by the same hashFieldValues used at MyInfo prefill time (encrypt
 * and MRF share it), and compared through the same compareHashedValues path
 * encrypt mode uses, with only the adapter under test in between.
 */
describe('MRF Children MyInfo hash check parity', () => {
  const FIELD_ID = new ObjectId().toHexString()
  const CHILD_NAME = 'PHUA CHU KING'
  const CHILD_BC = 'T1234567X'
  // MyInfo returns dates in yyyy-MM-dd; the FE displays (and submits)
  // dd/MM/yyyy. hashFieldValues hashes the display format.
  const CHILD_DOB_MYINFO = '2020-01-31'
  const CHILD_DOB_DISPLAY = '31/01/2020'

  const CHILDREN_SUBFIELDS = [
    MyInfoChildAttributes.ChildName,
    MyInfoChildAttributes.ChildBirthCertNo,
    MyInfoChildAttributes.ChildDateOfBirth,
  ]

  const childrenFieldBase = {
    _id: FIELD_ID,
    title: 'Children',
    fieldType: BasicField.Children,
    childrenSubFields: CHILDREN_SUBFIELDS,
    myInfo: { attr: MyInfoAttribute.ChildrenBirthRecords },
    disabled: false,
  }
  const childrenFieldForHashing =
    childrenFieldBase as unknown as PossiblyPrefilledField
  const childrenFieldForAdapting =
    childrenFieldBase as unknown as FormFieldSchema

  const childrenBirthRecords: MyInfoChildData = {
    [MyInfoChildAttributes.ChildName]: [CHILD_NAME],
    [MyInfoChildAttributes.ChildBirthCertNo]: [CHILD_BC],
    [MyInfoChildAttributes.ChildDateOfBirth]: [CHILD_DOB_MYINFO],
  }

  const makeV4Responses = (overrides?: {
    name?: string
    bc?: string
    dob?: string
  }): ParsedClearFormFieldResponsesV4 =>
    ({
      [FIELD_ID]: {
        fieldType: BasicField.Children,
        question: 'Children',
        provenance: {},
        answer: {
          child0: {
            value: {
              [MyInfoChildAttributes.ChildName]: {
                value: overrides?.name ?? CHILD_NAME,
              },
              [MyInfoChildAttributes.ChildBirthCertNo]: {
                value: overrides?.bc ?? CHILD_BC,
              },
              [MyInfoChildAttributes.ChildDateOfBirth]: {
                value: overrides?.dob ?? CHILD_DOB_DISPLAY,
              },
            },
          },
        },
      },
    }) as unknown as ParsedClearFormFieldResponsesV4

  const hashPrefilledChildValues = async (): Promise<IHashes> => {
    const hashPromises = hashFieldValues(
      [childrenFieldForHashing],
      childrenBirthRecords,
    )
    const entries = await Promise.all(
      Object.entries(hashPromises).map(
        async ([key, promise]) => [key, await promise] as const,
      ),
    )
    return Object.fromEntries(entries) as IHashes
  }

  const runComparisons = async (
    responses: ParsedClearFormFieldResponsesV4,
    hashes: IHashes,
  ): Promise<Map<string, boolean>> => {
    const adapted = adaptV4ResponsesForMyInfoHashCheck(responses, [
      childrenFieldForAdapting,
    ])
    const comparisonPromises = compareHashedValues(adapted, hashes)
    const results = new Map<string, boolean>()
    for (const [key, promise] of comparisonPromises.entries()) {
      results.set(String(key), await promise)
    }
    return results
  }

  it('should pass every per-child comparison for an untampered submission', async () => {
    const hashes = await hashPrefilledChildValues()

    const results = await runComparisons(makeV4Responses(), hashes)

    // Every prefilled subfield is compared, keyed by the same per-child hash
    // key scheme encrypt mode uses.
    const expectedKeys = CHILDREN_SUBFIELDS.map((attr) =>
      getMyInfoChildHashKey(FIELD_ID, attr, 0, CHILD_NAME),
    )
    expect([...results.keys()].sort()).toEqual([...expectedKeys].sort())
    expect([...results.values()].every(Boolean)).toBe(true)
  })

  it('should fail the comparison for a tampered child attribute', async () => {
    const hashes = await hashPrefilledChildValues()

    const results = await runComparisons(
      makeV4Responses({ bc: 'T9999999Z' }),
      hashes,
    )

    const tamperedKey = getMyInfoChildHashKey(
      FIELD_ID,
      MyInfoChildAttributes.ChildBirthCertNo,
      0,
      CHILD_NAME,
    )
    expect(results.get(tamperedKey)).toBe(false)
    // checkMyInfoHashes rejects the submission when any comparison is false.
    expect([...results.values()].every(Boolean)).toBe(false)
  })

  it('should fail the comparison for a tampered child date of birth', async () => {
    const hashes = await hashPrefilledChildValues()

    const results = await runComparisons(
      makeV4Responses({ dob: '01/01/2019' }),
      hashes,
    )

    const tamperedKey = getMyInfoChildHashKey(
      FIELD_ID,
      MyInfoChildAttributes.ChildDateOfBirth,
      0,
      CHILD_NAME,
    )
    expect(results.get(tamperedKey)).toBe(false)
  })

  it('should skip comparisons when the child name does not match any hashed child (encrypt-mode parity)', async () => {
    // Encrypt mode intentionally lets unmatched children pass through as
    // user-filled: hash keys embed the child name, so a different name finds
    // no hashes to compare against. This documents that MRF inherits the
    // same semantics rather than tightening them.
    const hashes = await hashPrefilledChildValues()

    const results = await runComparisons(
      makeV4Responses({ name: 'SOMEONE ELSE' }),
      hashes,
    )

    expect(results.size).toBe(0)
  })
})

import { ObjectId } from 'bson'
import {
  BasicField,
  MyInfoAttribute,
  MyInfoChildAttributes,
  MyInfoChildData,
} from 'formsg-shared/types'

import { IHashes, PossiblyPrefilledField } from '../../../../types'
import { formatMyInfoStorageResponseData } from '../../submission/encrypt-submission/encrypt-submission.utils'
import { ProcessedChildrenResponse } from '../../submission/submission.types'
import { compareHashedValues, hashFieldValues } from '../myinfo.util'

const SUB_FIELDS = [
  MyInfoChildAttributes.ChildName,
  MyInfoChildAttributes.ChildGender,
  MyInfoChildAttributes.ChildRace,
]

const TWO_CHILDREN: MyInfoChildData = {
  [MyInfoChildAttributes.ChildName]: ['Born Child', 'Sponsored Child'],
  [MyInfoChildAttributes.ChildGender]: ['FEMALE', 'MALE'],
  [MyInfoChildAttributes.ChildRace]: ['CHINESE', 'INDIAN'],
}

const buildHashes = async (
  fieldId: string,
  children: MyInfoChildData,
): Promise<IHashes> => {
  const field = {
    _id: fieldId,
    fieldType: BasicField.Children,
    myInfo: { attr: MyInfoAttribute.ChildrenBirthRecords },
    childrenSubFields: SUB_FIELDS,
  } as unknown as PossiblyPrefilledField
  const hashPromises = hashFieldValues([field], children)
  const entries = await Promise.all(
    Object.entries(hashPromises).map(
      async ([key, promise]) => [key, await promise] as const,
    ),
  )
  return Object.fromEntries(entries)
}

const buildResponse = (
  fieldId: string,
  childAnswer: string[],
): ProcessedChildrenResponse =>
  ({
    _id: fieldId,
    question: 'Child',
    fieldType: BasicField.Children,
    answerArray: [childAnswer],
    childSubFieldsArray: SUB_FIELDS,
    myInfo: { attr: MyInfoAttribute.ChildrenBirthRecords },
    isVisible: true,
  }) as unknown as ProcessedChildrenResponse

const resolveComparisons = async (
  fieldId: string,
  childAnswer: string[],
  hashes: IHashes,
): Promise<Record<string, boolean>> => {
  const comparisons = compareHashedValues(
    [buildResponse(fieldId, childAnswer)],
    hashes,
  )
  const entries = await Promise.all(
    Array.from(comparisons.entries()).map(
      async ([key, promise]) => [key, await promise] as const,
    ),
  )
  return Object.fromEntries(entries)
}

describe('handleMyInfoChildHashResponse', () => {
  const fieldId = new ObjectId().toHexString()

  it('should verify every sub-answer when the respondent picks a child other than the first', async () => {
    const hashes = await buildHashes(fieldId, TWO_CHILDREN)

    const results = await resolveComparisons(
      fieldId,
      ['Sponsored Child', 'MALE', 'INDIAN'],
      hashes,
    )

    expect(results).toEqual({
      [`childrenbirthrecords.${fieldId}.childname.0.Sponsored Child`]: true,
      [`childrenbirthrecords.${fieldId}.childgender.0.Sponsored Child`]: true,
      [`childrenbirthrecords.${fieldId}.childrace.0.Sponsored Child`]: true,
    })
  })

  it('should keep verifying when the respondent picks the first child', async () => {
    const hashes = await buildHashes(fieldId, TWO_CHILDREN)

    const results = await resolveComparisons(
      fieldId,
      ['Born Child', 'FEMALE', 'CHINESE'],
      hashes,
    )

    expect(results).toEqual({
      [`childrenbirthrecords.${fieldId}.childname.0.Born Child`]: true,
      [`childrenbirthrecords.${fieldId}.childgender.0.Born Child`]: true,
      [`childrenbirthrecords.${fieldId}.childrace.0.Born Child`]: true,
    })
  })

  it('should compare nothing for a hand-typed child absent from the MyInfo records', async () => {
    const hashes = await buildHashes(fieldId, TWO_CHILDREN)

    const results = await resolveComparisons(
      fieldId,
      ['Hand Typed Child', 'MALE', 'INDIAN'],
      hashes,
    )

    expect(results).toEqual({})
  })

  it('should fail only the hand-edited sub-answer of a non-first child', async () => {
    const hashes = await buildHashes(fieldId, TWO_CHILDREN)

    const results = await resolveComparisons(
      fieldId,
      ['Sponsored Child', 'FEMALE', 'INDIAN'],
      hashes,
    )

    expect(results).toEqual({
      [`childrenbirthrecords.${fieldId}.childname.0.Sponsored Child`]: true,
      [`childrenbirthrecords.${fieldId}.childgender.0.Sponsored Child`]: false,
      [`childrenbirthrecords.${fieldId}.childrace.0.Sponsored Child`]: true,
    })
  })

  it('should verify the picked child when two children share a name', async () => {
    const hashes = await buildHashes(fieldId, {
      [MyInfoChildAttributes.ChildName]: ['Same Name', 'Same Name'],
      [MyInfoChildAttributes.ChildGender]: ['FEMALE', 'MALE'],
      [MyInfoChildAttributes.ChildRace]: ['CHINESE', 'INDIAN'],
    })

    const results = await resolveComparisons(
      fieldId,
      ['Same Name', 'MALE', 'INDIAN'],
      hashes,
    )

    expect(results).toEqual({
      [`childrenbirthrecords.${fieldId}.childname.0.Same Name`]: true,
      [`childrenbirthrecords.${fieldId}.childgender.0.Same Name`]: true,
      [`childrenbirthrecords.${fieldId}.childrace.0.Same Name`]: true,
    })
  })

  it('should prefix the exploded questions with [Myinfo] for a non-first child', async () => {
    const hashes = await buildHashes(fieldId, TWO_CHILDREN)
    const childAnswer = ['Sponsored Child', 'MALE', 'INDIAN']
    const comparisons = compareHashedValues(
      [buildResponse(fieldId, childAnswer)],
      hashes,
    )
    const hashedFields = new Set(
      (
        await Promise.all(
          Array.from(comparisons.entries()).map(
            async ([key, promise]) => [key, await promise] as const,
          ),
        )
      )
        .filter(([, matched]) => matched)
        .map(([key]) => key),
    )

    const formatted = formatMyInfoStorageResponseData(
      [buildResponse(fieldId, childAnswer)],
      hashedFields,
    )

    expect(formatted.map((response) => response.question)).toEqual([
      '[Myinfo] Child 1 Name',
      '[Myinfo] Child 1 Sex',
      '[Myinfo] Child 1 Race',
    ])
  })
})

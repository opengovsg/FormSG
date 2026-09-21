import { ObjectId } from 'bson'
import {
  BasicField,
  MyInfoAttribute,
  MyInfoChildAttributes,
  MyInfoChildData,
} from 'formsg-shared/types'

import { IHashes } from 'src/types'
import { PossiblyPrefilledField } from 'src/types/field/myinfoField'

import { ProcessedChildrenResponse } from '../../submission/submission.types'
import {
  compareHashedValues,
  getMyInfoChildHashKey,
  hashFieldValues,
} from '../myinfo.util'

describe('myinfo.util', () => {
  describe('compareHashedValues (children)', () => {
    const FIELD_ID = new ObjectId().toHexString()
    const SUBFIELDS = [
      MyInfoChildAttributes.ChildName,
      MyInfoChildAttributes.ChildDateOfBirth,
    ]
    const childrenField = {
      _id: FIELD_ID,
      title: 'Children',
      fieldType: BasicField.Children,
      childrenSubFields: SUBFIELDS,
      myInfo: { attr: MyInfoAttribute.ChildrenBirthRecords },
      disabled: false,
    } as unknown as PossiblyPrefilledField

    const hashChildren = async (data: MyInfoChildData): Promise<IHashes> => {
      const promises = hashFieldValues([childrenField], data)
      const entries = await Promise.all(
        Object.entries(promises).map(
          async ([key, promise]) => [key, await promise] as const,
        ),
      )
      return Object.fromEntries(entries) as IHashes
    }

    // Encrypt-mode shape: a positional answerArray with the selected child at
    // index 0, since a field accepts a single child.
    const makeResponse = (child: string[]): ProcessedChildrenResponse =>
      ({
        _id: FIELD_ID,
        question: 'Children',
        fieldType: BasicField.Children,
        answerArray: [child],
        childSubFieldsArray: SUBFIELDS,
        myInfo: { attr: MyInfoAttribute.ChildrenBirthRecords },
        isVisible: true,
      }) as unknown as ProcessedChildrenResponse

    const resolve = async (
      map: Map<string, Promise<boolean>>,
    ): Promise<Record<string, boolean>> =>
      Object.fromEntries(
        await Promise.all(
          [...map.entries()].map(async ([k, p]) => [k, await p] as const),
        ),
      )

    it('should verify the second MyInfo child submitted at answer position 0', async () => {
      const hashes = await hashChildren({
        [MyInfoChildAttributes.ChildName]: ['FIRST CHILD', 'SECOND CHILD'],
        [MyInfoChildAttributes.ChildDateOfBirth]: ['2015-01-02', '2018-03-04'],
      })

      const results = await resolve(
        compareHashedValues(
          [makeResponse(['SECOND CHILD', '04/03/2018'])],
          hashes,
        ),
      )

      expect(results).toEqual({
        [getMyInfoChildHashKey(
          FIELD_ID,
          MyInfoChildAttributes.ChildName,
          0,
          'SECOND CHILD',
        )]: true,
        [getMyInfoChildHashKey(
          FIELD_ID,
          MyInfoChildAttributes.ChildDateOfBirth,
          0,
          'SECOND CHILD',
        )]: true,
      })
    })

    it('should still reject a tampered value for an out-of-position child', async () => {
      const hashes = await hashChildren({
        [MyInfoChildAttributes.ChildName]: ['FIRST CHILD', 'SECOND CHILD'],
        [MyInfoChildAttributes.ChildDateOfBirth]: ['2015-01-02', '2018-03-04'],
      })

      const results = await resolve(
        compareHashedValues(
          [makeResponse(['SECOND CHILD', '01/01/2000'])],
          hashes,
        ),
      )

      expect(
        results[
          getMyInfoChildHashKey(
            FIELD_ID,
            MyInfoChildAttributes.ChildDateOfBirth,
            0,
            'SECOND CHILD',
          )
        ],
      ).toBe(false)
    })

    it('should accept a match against any MyInfo child sharing the submitted name', async () => {
      const hashes = await hashChildren({
        [MyInfoChildAttributes.ChildName]: ['SAME NAME', 'SAME NAME'],
        [MyInfoChildAttributes.ChildDateOfBirth]: ['2015-01-02', '2018-03-04'],
      })

      const results = await resolve(
        compareHashedValues(
          [makeResponse(['SAME NAME', '04/03/2018'])],
          hashes,
        ),
      )

      expect(Object.values(results).every(Boolean)).toBe(true)
    })

    it('should match child names that contain dots', async () => {
      const hashes = await hashChildren({
        [MyInfoChildAttributes.ChildName]: ['OTHER', 'A. B. TAN'],
        [MyInfoChildAttributes.ChildDateOfBirth]: ['2015-01-02', '2018-03-04'],
      })

      const results = await resolve(
        compareHashedValues(
          [makeResponse(['A. B. TAN', '04/03/2018'])],
          hashes,
        ),
      )

      expect(Object.keys(results)).toHaveLength(2)
      expect(Object.values(results).every(Boolean)).toBe(true)
    })

    it('should compare nothing for a child with no stored hash (user-filled pass-through)', async () => {
      const hashes = await hashChildren({
        [MyInfoChildAttributes.ChildName]: ['FIRST CHILD'],
        [MyInfoChildAttributes.ChildDateOfBirth]: ['2015-01-02'],
      })

      const results = compareHashedValues(
        [makeResponse(['UNKNOWN CHILD', '01/01/2020'])],
        hashes,
      )

      expect(results.size).toBe(0)
    })
  })
})

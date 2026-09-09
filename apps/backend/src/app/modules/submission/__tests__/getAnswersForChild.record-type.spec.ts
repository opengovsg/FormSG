import { ObjectId } from 'bson'
import { BasicField, MyInfoChildAttributes } from 'formsg-shared/types'

import { ProcessedChildrenResponse } from '../submission.types'
import { getAnswersForChild } from '../submission.utils'

describe('getAnswersForChild record type', () => {
  const _id = new ObjectId().toHexString()

  it('should append a Record Type row when recordType is present', () => {
    const response = {
      _id,
      question: 'Child',
      fieldType: BasicField.Children,
      answerArray: [['Sponsored Child', 'MALE']],
      childSubFieldsArray: [
        MyInfoChildAttributes.ChildName,
        MyInfoChildAttributes.ChildGender,
      ],
      recordType: 'Sponsored',
      isVisible: true,
    } as unknown as ProcessedChildrenResponse

    const answers = getAnswersForChild(response)

    expect(answers).toHaveLength(3)
    expect(answers.map((a) => [a._id, a.question, a.answer])).toEqual([
      [
        `childrenbirthrecords.${_id}.childname.0`,
        'Child 1 Name',
        'Sponsored Child',
      ],
      [`childrenbirthrecords.${_id}.childgender.0`, 'Child 1 Sex', 'MALE'],
      [
        `childrenbirthrecords.${_id}.recordtype.0`,
        'Child 1 Record Type',
        'Sponsored',
      ],
    ])
  })

  it('should omit the Record Type row when recordType is absent (legacy responses)', () => {
    const response = {
      _id,
      question: 'Child',
      fieldType: BasicField.Children,
      answerArray: [['Born Child', 'FEMALE']],
      childSubFieldsArray: [
        MyInfoChildAttributes.ChildName,
        MyInfoChildAttributes.ChildGender,
      ],
      isVisible: true,
    } as unknown as ProcessedChildrenResponse

    const answers = getAnswersForChild(response)

    expect(answers).toHaveLength(2)
    expect(answers.some((a) => a.question.includes('Record Type'))).toBe(false)
  })
})

import { ObjectId } from 'bson'
import { BasicField, MyInfoChildAttributes } from 'formsg-shared/types'

import { ProcessedChildrenResponse } from '../submission.types'
import { getAnswersForChild } from '../submission.utils'

// v2.0 does not reshape, purge or split stored submissions, so already-stored
// responses must keep exploding into exactly the same flat fields.
describe('children v1 response back-compatibility', () => {
  const _id = new ObjectId().toHexString()

  it('should explode a stored secondary race answer unchanged', () => {
    const response = {
      _id,
      question: 'Child',
      fieldType: BasicField.Children,
      answerArray: [['Phua Chu King', 'CHINESE', 'MALAY']],
      childSubFieldsArray: [
        MyInfoChildAttributes.ChildName,
        MyInfoChildAttributes.ChildRace,
        MyInfoChildAttributes.ChildSecondaryRace,
      ],
      isVisible: true,
    } as unknown as ProcessedChildrenResponse

    const answers = getAnswersForChild(response)

    expect(answers).toHaveLength(3)
    expect(answers.map((a) => [a._id, a.question, a.answer])).toEqual([
      [
        `childrenbirthrecords.${_id}.childname.0`,
        'Child 1 Name',
        'Phua Chu King',
      ],
      [`childrenbirthrecords.${_id}.childrace.0`, 'Child 1 Race', 'CHINESE'],
      [
        `childrenbirthrecords.${_id}.childsecondaryrace.0`,
        'Child 1 Secondary race',
        'MALAY',
      ],
    ])
  })

  it('should explode a stored multi-child answer unchanged, without auto-splitting', () => {
    const response = {
      _id,
      question: 'Child',
      fieldType: BasicField.Children,
      answerArray: [
        ['Phua Chu King', 'T1234567X'],
        ['Phua Chu Beng', 'T7654321X'],
      ],
      childSubFieldsArray: [
        MyInfoChildAttributes.ChildName,
        MyInfoChildAttributes.ChildBirthCertNo,
      ],
      isVisible: true,
    } as unknown as ProcessedChildrenResponse

    const answers = getAnswersForChild(response)

    expect(answers).toHaveLength(4)
    expect(answers.map((a) => [a._id, a.question, a.answer])).toEqual([
      [
        `childrenbirthrecords.${_id}.childname.0`,
        'Child 1 Name',
        'Phua Chu King',
      ],
      [
        `childrenbirthrecords.${_id}.childbirthcertno.0`,
        'Child 1 Birth certificate number',
        'T1234567X',
      ],
      [
        `childrenbirthrecords.${_id}.childname.1`,
        'Child 2 Name',
        'Phua Chu Beng',
      ],
      [
        `childrenbirthrecords.${_id}.childbirthcertno.1`,
        'Child 2 Birth certificate number',
        'T7654321X',
      ],
    ])
  })
})

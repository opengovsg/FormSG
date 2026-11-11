import {
  BasicField,
  FormFieldDto,
  MyInfoAttribute,
} from 'formsg-shared/types/field'

import { applyMyInfoVerifiedView } from './applyMyInfoVerifiedView'
import { augmentWithMyInfoDisplayValue } from './augmentWithMyInfoDisplayValue'

const myInfoField = (
  attr: MyInfoAttribute,
  fieldType: BasicField,
): FormFieldDto =>
  augmentWithMyInfoDisplayValue({
    _id: attr,
    title: attr,
    fieldType,
    myInfo: { attr },
  } as FormFieldDto)

const asSingaporean = applyMyInfoVerifiedView('SG')

describe('applyMyInfoVerifiedView', () => {
  it('locks a verified field and keeps its sample value', () => {
    const field = asSingaporean(
      myInfoField(MyInfoAttribute.Name, BasicField.ShortText),
    )
    expect(field).toMatchObject({ fieldValue: 'PHUA CHU KANG', disabled: true })
  })

  it('blanks an unverified field and leaves it editable', () => {
    const field = asSingaporean(
      myInfoField(MyInfoAttribute.Occupation, BasicField.Dropdown),
    )
    expect(field.fieldValue).toBe('')
    expect(field.disabled).toBeFalsy()
  })

  it('leaves a children field untouched', () => {
    const field = myInfoField(
      MyInfoAttribute.ChildrenBirthRecords,
      BasicField.Children,
    )
    expect(asSingaporean(field)).toBe(field)
  })

  it('leaves a field without Myinfo untouched', () => {
    const field = {
      _id: 'plain',
      title: 'Plain',
      fieldType: BasicField.ShortText,
    } as FormFieldDto
    expect(asSingaporean(field)).toBe(field)
  })
})

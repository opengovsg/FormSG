import {
  BasicField,
  FormFieldDto,
  MyInfoAttribute,
} from 'formsg-shared/types/field'

import { augmentWithMyInfoDisplayValue } from './augmentWithMyInfoDisplayValue'

const myInfoField = (
  attr: MyInfoAttribute,
  fieldType: BasicField,
): FormFieldDto =>
  ({
    _id: attr,
    title: attr,
    fieldType,
    myInfo: { attr },
  }) as FormFieldDto

describe('augmentWithMyInfoDisplayValue', () => {
  it('locks a sample value that a verified login would lock', () => {
    const field = augmentWithMyInfoDisplayValue(
      myInfoField(MyInfoAttribute.Name, BasicField.ShortText),
    )
    expect(field).toMatchObject({ fieldValue: 'PHUA CHU KANG', disabled: true })
  })

  it('locks a dropdown whose sample is one of its options', () => {
    const field = augmentWithMyInfoDisplayValue(
      myInfoField(MyInfoAttribute.Sex, BasicField.Dropdown),
    )
    expect(field).toMatchObject({ fieldValue: 'MALE', disabled: true })
  })

  it('leaves a dropdown editable when its sample is not one of its options', () => {
    const field = augmentWithMyInfoDisplayValue(
      myInfoField(MyInfoAttribute.Occupation, BasicField.Dropdown),
    )
    expect(field.disabled).toBeFalsy()
  })

  it('leaves marital details editable', () => {
    const field = augmentWithMyInfoDisplayValue(
      myInfoField(MyInfoAttribute.Marital, BasicField.Dropdown),
    )
    expect(field).toMatchObject({ fieldValue: 'MARRIED' })
    expect(field.disabled).toBeFalsy()
  })

  it('leaves a field without Myinfo untouched', () => {
    const field = {
      _id: 'plain',
      title: 'Plain',
      fieldType: BasicField.ShortText,
    } as FormFieldDto
    expect(augmentWithMyInfoDisplayValue(field)).toBe(field)
  })
})

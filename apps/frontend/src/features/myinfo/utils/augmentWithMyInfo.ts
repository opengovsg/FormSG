import { MYINFO_ATTRIBUTE_MAP } from 'formsg-shared/constants/field/myinfo'
import {
  BasicField,
  FormFieldDto,
  MyInfoFormField,
} from 'formsg-shared/types/field'

// Making a copy by destructuring so original object does not get affected.
export const augmentWithMyInfo = ({
  ...field
}: FormFieldDto): MyInfoFormField => {
  // Only dropdown fields have augmented options for now.
  switch (field.fieldType) {
    case BasicField.Dropdown: {
      // No need to augment if no MyInfo attribute
      if (!field.myInfo?.attr) return field
      const myInfoBlock = MYINFO_ATTRIBUTE_MAP[field.myInfo.attr]
      field.fieldOptions = myInfoBlock.fieldOptions ?? []
      return field
    }
    case BasicField.Children: {
      if (!field.myInfo?.attr) return field
      const myInfoBlock = MYINFO_ATTRIBUTE_MAP[field.myInfo.attr]
      field.title = myInfoBlock.value
      return field
    }
    default:
      return field
  }
}

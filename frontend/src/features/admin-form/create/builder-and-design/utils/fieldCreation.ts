import { pick } from 'lodash'

import { MYINFO_ATTRIBUTE_MAP } from '~shared/constants/field/myinfo'
import {
  AllowedMyInfoFieldOption,
  AttachmentSize,
  BasicField,
  FieldBase,
  FieldCreateDto,
  FormField,
  MyInfoAttribute,
  MyInfoField,
  RatingShape,
} from '~shared/types/field'

import { BASICFIELD_TO_DRAWER_META } from '../../constants'
import {
  MYINFO_CHILDRENFIELD_META,
  MYINFO_DATEFIELD_META,
  MYINFO_DROPDOWNFIELD_META,
  MYINFO_MOBILEFIELD_META,
  MYINFO_TEXTFIELD_META,
} from '../constants'

import { createShortTextColumn } from './columnCreation'

/**
 * Utility methods to create bare minimum meta required for field creation.
 */
export const getFieldCreationMeta = (fieldType: BasicField): FieldCreateDto => {
  const baseMeta: Pick<
    FieldCreateDto,
    'description' | 'disabled' | 'required' | 'title'
  > = {
    description: '',
    disabled: false,
    required: true,
    title: BASICFIELD_TO_DRAWER_META[fieldType].label,
  }

  switch (fieldType) {
    case BasicField.Attachment: {
      return {
        fieldType,
        ...baseMeta,
        attachmentSize: AttachmentSize.OneMb,
      }
    }
    case BasicField.YesNo:
    case BasicField.Nric:
    case BasicField.Uen:
    case BasicField.Section:
    case BasicField.Statement: {
      return {
        fieldType,
        ...baseMeta,
      }
    }
    case BasicField.Checkbox: {
      return {
        fieldType,
        ...baseMeta,
        ValidationOptions: {
          customMax: null,
          customMin: null,
        },
        validateByValue: false,
        fieldOptions: ['Option 1', 'Option 2'],
        othersRadioButton: false,
      }
    }
    case BasicField.Mobile: {
      return {
        fieldType,
        ...baseMeta,
        isVerifiable: false,
        allowIntlNumbers: false,
      }
    }
    case BasicField.HomeNo: {
      return {
        fieldType,
        ...baseMeta,
        allowIntlNumbers: false,
      }
    }
    case BasicField.ShortText: {
      return {
        fieldType,
        ...baseMeta,
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
        allowPrefill: false,
        lockPrefill: false,
      }
    }
    case BasicField.LongText:
      return {
        fieldType,
        ...baseMeta,
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      }
    case BasicField.Number: {
      return {
        fieldType,
        ...baseMeta,
        ValidationOptions: {
          selectedValidation: null,
          LengthValidationOptions: {
            selectedLengthValidation: null,
            customVal: null,
          },
          RangeValidationOptions: {
            customMin: null,
            customMax: null,
          },
        },
      }
    }
    case BasicField.Dropdown: {
      return {
        fieldType,
        ...baseMeta,
        fieldOptions: ['Option 1', 'Option 2'],
      }
    }
    case BasicField.Image: {
      return {
        fieldType,
        ...baseMeta,
        fileMd5Hash: '',
        name: '',
        url: '',
        size: '',
      }
    }
    case BasicField.Decimal: {
      return {
        fieldType,
        ...baseMeta,
        validateByValue: false,
        ValidationOptions: {
          customMin: null,
          customMax: null,
        },
      }
    }
    case BasicField.Email: {
      return {
        fieldType,
        ...baseMeta,
        isVerifiable: false,
        hasAllowedEmailDomains: false,
        allowedEmailDomains: [],
        autoReplyOptions: {
          hasAutoReply: false,
          autoReplySubject: '',
          autoReplyMessage: '',
          autoReplySender: '',
          includeFormSummary: false,
        },
      }
    }
    case BasicField.Radio: {
      return {
        fieldType,
        ...baseMeta,
        fieldOptions: ['Option 1', 'Option 2'],
        othersRadioButton: false,
      }
    }
    case BasicField.Rating: {
      return {
        fieldType,
        ...baseMeta,
        ratingOptions: {
          shape: RatingShape.Star,
          steps: 5,
        },
      }
    }
    case BasicField.Date: {
      return {
        fieldType,
        ...baseMeta,
        dateValidation: {
          customMaxDate: null,
          customMinDate: null,
          selectedDateValidation: null,
        },
      }
    }
    case BasicField.Table: {
      return {
        fieldType,
        ...baseMeta,
        columns: [createShortTextColumn()],
        minimumRows: 2,
      }
    }
    case BasicField.CountryRegion: {
      return {
        fieldType,
        ...baseMeta,
        fieldOptions: [],
      }
    }
    case BasicField.Children: {
      return {
        fieldType,
        ...baseMeta,
      }
    }
    case BasicField.Address: {
      return {
        fieldType,
        ...baseMeta,
      }
    }
  }
}

export const getMyInfoFieldCreationMeta = (
  myInfoAttribute: AllowedMyInfoFieldOption,
): MyInfoField => {
  const baseMeta: Pick<
    MyInfoField,
    | 'disabled'
    | 'required'
    | 'title'
    | 'description'
    | 'fieldType'
    | 'myInfo'
    | 'titleTranslations'
    | 'descriptionTranslations'
  > = {
    disabled: false,
    required: true,
    title: MYINFO_ATTRIBUTE_MAP[myInfoAttribute].value,
    titleTranslations: MYINFO_ATTRIBUTE_MAP[myInfoAttribute]?.titleTranslations,
    description: '',
    fieldType: MYINFO_ATTRIBUTE_MAP[myInfoAttribute].fieldType,
    myInfo: {
      attr: myInfoAttribute,
    },
  }

  switch (myInfoAttribute) {
    case MyInfoAttribute.Name:
    case MyInfoAttribute.PassportNumber:
    case MyInfoAttribute.VehicleNo:
    case MyInfoAttribute.RegisteredAddress:
    case MyInfoAttribute.MarriageCertNo:
    case MyInfoAttribute.Employment: {
      return {
        ...baseMeta,
        fieldType: BasicField.ShortText,
        ...MYINFO_TEXTFIELD_META,
      }
    }

    case MyInfoAttribute.DateOfBirth:
    case MyInfoAttribute.PassportExpiryDate:
    case MyInfoAttribute.WorkpassExpiryDate:
    case MyInfoAttribute.MarriageDate:
    case MyInfoAttribute.DivorceDate: {
      return {
        ...baseMeta,
        fieldType: BasicField.Date,
        ...MYINFO_DATEFIELD_META,
      }
    }

    case MyInfoAttribute.Sex:
    case MyInfoAttribute.Race:
    case MyInfoAttribute.Nationality:
    case MyInfoAttribute.BirthCountry:
    case MyInfoAttribute.ResidentialStatus:
    case MyInfoAttribute.Dialect:
    case MyInfoAttribute.HousingType:
    case MyInfoAttribute.HdbType:
    case MyInfoAttribute.Occupation:
    case MyInfoAttribute.WorkpassStatus:
    case MyInfoAttribute.Marital:
    case MyInfoAttribute.CountryOfMarriage: {
      return {
        ...baseMeta,
        fieldType: BasicField.Dropdown,
        ...MYINFO_DROPDOWNFIELD_META,
      }
    }

    case MyInfoAttribute.MobileNo: {
      return {
        ...baseMeta,
        fieldType: BasicField.Mobile,
        ...MYINFO_MOBILEFIELD_META,
      }
    }

    case MyInfoAttribute.ChildrenBirthRecords: {
      return {
        ...baseMeta,
        fieldType: BasicField.Children,
        ...MYINFO_CHILDRENFIELD_META,
      }
    }

    default: {
      const exception: never = myInfoAttribute
      throw new Error(`MyInfo type is not implemented: ${exception}`)
    }
  }
}

/**
 * Gets valid properties for a given BasicField field type
 */
const getValidPropertiesForFieldType = (fieldType: BasicField): string[] => {
  const baseProperties = [
    'fieldType',
    'title',
    'description',
    'required',
    'disabled',
    'titleTranslations',
    'descriptionTranslations',
    'globalId',
  ]

  const fieldTypeProperties = {
    [BasicField.Section]: baseProperties,
    [BasicField.Statement]: baseProperties,
    [BasicField.Email]: [
      ...baseProperties,
      'isVerifiable',
      'hasAllowedEmailDomains',
      'allowedEmailDomains',
      'autoReplyOptions',
    ],
    [BasicField.Mobile]: [
      ...baseProperties,
      'isVerifiable',
      'allowIntlNumbers',
    ],
    [BasicField.HomeNo]: [...baseProperties, 'allowIntlNumbers', 'myInfo'],
    [BasicField.Number]: [
      ...baseProperties,
      'ValidationOptions',
      'ValidationOptions.selectedValidation',
      'ValidationOptions.LengthValidationOptions',
      'ValidationOptions.LengthValidationOptions.selectedLengthValidation',
      'ValidationOptions.LengthValidationOptions.customVal',
      'ValidationOptions.RangeValidationOptions',
      'ValidationOptions.RangeValidationOptions.customMin',
      'ValidationOptions.RangeValidationOptions.customMax',
    ],
    [BasicField.Decimal]: [
      ...baseProperties,
      'validateByValue',
      'ValidationOptions',
      'ValidationOptions.customMin',
      'ValidationOptions.customMax',
    ],
    [BasicField.Image]: [
      ...baseProperties,
      'fileMd5Hash',
      'name',
      'url',
      'size',
    ],
    [BasicField.ShortText]: [
      ...baseProperties,
      'ValidationOptions',
      'ValidationOptions.selectedValidation',
      'ValidationOptions.customVal',
      'allowPrefill',
      'lockPrefill',
    ],
    [BasicField.LongText]: [
      ...baseProperties,
      'ValidationOptions',
      'ValidationOptions.selectedValidation',
      'ValidationOptions.customVal',
    ],
    [BasicField.Dropdown]: [
      ...baseProperties,
      'fieldOptions',
      'fieldOptionsTranslations',
    ],
    [BasicField.CountryRegion]: [...baseProperties, 'fieldOptions', 'myInfo'],
    [BasicField.YesNo]: [...baseProperties, 'myInfo'],
    [BasicField.Checkbox]: [
      ...baseProperties,
      'fieldOptions',
      'fieldOptionsTranslations',
      'othersRadioButton',
      'ValidationOptions',
      'ValidationOptions.customMin',
      'ValidationOptions.customMax',
      'validateByValue',
    ],
    [BasicField.Radio]: [
      ...baseProperties,
      'fieldOptions',
      'fieldOptionsTranslations',
      'othersRadioButton',
    ],
    [BasicField.Attachment]: [...baseProperties, 'attachmentSize'],
    [BasicField.Date]: [
      ...baseProperties,
      'dateValidation',
      'dateValidation.customMaxDate',
      'dateValidation.customMinDate',
      'dateValidation.selectedDateValidation',
    ],
    [BasicField.Rating]: [
      ...baseProperties,
      'ratingOptions',
      'ratingOptions.shape',
      'ratingOptions.steps',
    ],
    [BasicField.Nric]: [...baseProperties, 'myInfo'],
    [BasicField.Table]: [
      ...baseProperties,
      'columns',
      'minimumRows',
      'addMoreRows',
      'maximumRows',
    ],
    [BasicField.Uen]: [...baseProperties, 'myInfo'],
    [BasicField.Children]: [
      ...baseProperties,
      'childrenSubFields',
      'allowMultiple',
    ],
    [BasicField.Address]: [...baseProperties, 'addressSubFields'],
  }

  return fieldTypeProperties[fieldType] || baseProperties
}

/**
 * Filters an field object to only include properties valid for its field type.
 */
export const filterValidFieldTypeProperties = (field: FormField): FieldBase => {
  const validPropertyKeyPaths = getValidPropertiesForFieldType(field.fieldType)

  const filteredField = pick(field, validPropertyKeyPaths) as FieldBase

  return filteredField as FieldBase
}

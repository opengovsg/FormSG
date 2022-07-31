import {
  AttachmentSize,
  BasicField,
  FieldCreateDto,
  MyInfoAttribute,
  MyInfoField,
  RatingShape,
} from '~shared/types/field'

import {
  BASICFIELD_TO_DRAWER_META,
  MYINFO_FIELD_TO_DRAWER_META,
} from '../../constants'
import {
  MYINFO_DATEFIELD_META,
  MYINFO_DROPDOWNFIELD_META,
  MYINFO_FIELD_CONSTANTS,
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
        fieldOptions: ['Option 1'],
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
      }
    }
    case BasicField.LongText:
    case BasicField.Number: {
      return {
        fieldType,
        ...baseMeta,
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      }
    }
    case BasicField.Dropdown: {
      return {
        fieldType,
        ...baseMeta,
        fieldOptions: ['Option 1'],
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
        fieldOptions: ['Option 1'],
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
  }
}

export const getMyInfoFieldCreationMeta = (
  myInfoAttribute: MyInfoAttribute,
): MyInfoField => {
  const baseMeta: Pick<
    MyInfoField,
    'disabled' | 'required' | 'title' | 'description' | 'fieldType' | 'myInfo'
  > = {
    disabled: false,
    required: true,
    title: MYINFO_FIELD_TO_DRAWER_META[myInfoAttribute].label,
    description: '',
    fieldType: MYINFO_FIELD_CONSTANTS[myInfoAttribute].fieldType,
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

    default: {
      const exception: never = myInfoAttribute
      throw new Error(`MyInfo type is not implemented: ${exception}`)
    }
  }
}

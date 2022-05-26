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

/**
 * Utility methods to create bare minimum meta required for field creation.
 * TODO: Create one for every field type.
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
    default: {
      return {
        fieldType: BasicField.Section,
        ...baseMeta,
      }
    }
  }
}

export const getMyInfoFieldCreationMeta = (
  myInfoAttribute: MyInfoAttribute,
): MyInfoField => {
  const baseMeta: Pick<MyInfoField, 'disabled' | 'required' | 'title'> = {
    disabled: false,
    required: true,
    title: MYINFO_FIELD_TO_DRAWER_META[myInfoAttribute].label,
  }

  switch (myInfoAttribute) {
    case MyInfoAttribute.Name: {
      return {
        ...baseMeta,
        myInfo: {
          attr: myInfoAttribute,
        },
        description:
          'The registered name of the form-filler. This field is verified by ICA for Singaporeans/PRs & foreigners on Long-Term Visit Pass, and by MOM for Employment Pass holders.',
        fieldType: BasicField.ShortText,
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      }
    }
    default: {
      const exception: never = myInfoAttribute as never
      throw new Error(exception)
    }
  }
}

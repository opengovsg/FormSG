import {
  BiAlignLeft,
  BiBody,
  BiBook,
  BiBookContent,
  BiBookHeart,
  BiBriefcase,
  BiBuilding,
  BiCalculator,
  BiCalendar,
  BiCalendarAlt,
  BiCalendarEvent,
  BiCalendarHeart,
  BiCalendarMinus,
  BiCalendarX,
  BiCar,
  BiCaretDownSquare,
  BiCloudUpload,
  BiFlag,
  BiGlobe,
  BiGroup,
  BiHash,
  BiHeading,
  BiHeartCircle,
  BiHome,
  BiHomeAlt,
  BiHomeCircle,
  BiHomeHeart,
  BiIdCard,
  BiImage,
  BiInfinite,
  BiMailSend,
  BiMap,
  BiMobile,
  BiPhone,
  BiRadioCircleMarked,
  BiRename,
  BiSelectMultiple,
  BiStar,
  BiTable,
  BiText,
  BiToggleLeft,
  BiUser,
  BiUserVoice,
} from 'react-icons/bi'
import { As } from '@chakra-ui/react'

import { BasicField, MyInfoAttribute } from '~shared/types/field'

export type BuilderSidebarFieldMeta = {
  label: string
  icon: As
  // Is this fieldType included in submissions?
  isSubmitted: boolean
  searchAliases?: string[]
}

// !!! Do not use this to reference field titles for MyInfo fields. !!!
// !!! Use MYINFO_ATTRIBUTE_MAP in ~/shared/constants/field/myinfo/index.ts instead !!!
export const BASICFIELD_TO_DRAWER_META: {
  [key in BasicField]: BuilderSidebarFieldMeta
} = {
  [BasicField.Image]: {
    label: 'Image',
    icon: BiImage,
    isSubmitted: false,
    searchAliases: ['photo', 'picture'],
  },

  [BasicField.Statement]: {
    label: 'Paragraph',
    icon: BiText,
    isSubmitted: false,
    searchAliases: ['description'],
  },

  [BasicField.Section]: {
    label: 'Heading',
    icon: BiHeading,
    isSubmitted: false,
    searchAliases: ['header', 'title', 'section'],
  },

  [BasicField.Attachment]: {
    label: 'Attachment',
    icon: BiCloudUpload,
    isSubmitted: true,
    searchAliases: ['supporting', 'screenshot', 'document', 'file', 'upload'],
  },

  [BasicField.Checkbox]: {
    label: 'Checkbox',
    icon: BiSelectMultiple,
    isSubmitted: true,
    searchAliases: [
      'choice',
      'options',
      'multiple',
      'declaration',
      'acknowledgement',
    ],
  },

  [BasicField.Date]: {
    label: 'Date',
    icon: BiCalendarEvent,
    isSubmitted: true,
    searchAliases: [
      'birthdate',
      'dob',
      'date of birth',
      'event date',
      'start date',
      'end date',
      'time',
    ],
  },

  [BasicField.Decimal]: {
    label: 'Decimal',
    icon: BiCalculator,
    isSubmitted: true,
    searchAliases: ['price', 'amount', 'cost'],
  },

  [BasicField.Dropdown]: {
    label: 'Dropdown',
    icon: BiCaretDownSquare,
    isSubmitted: true,
    searchAliases: ['choice', 'options', 'category', 'type', 'status'],
  },

  [BasicField.CountryRegion]: {
    label: 'Country/Region',
    icon: BiFlag,
    isSubmitted: true,
    searchAliases: ['country', 'region', 'location', 'nationality'],
  },

  [BasicField.Email]: {
    label: 'Email',
    icon: BiMailSend,
    isSubmitted: true,
    searchAliases: ['contact'],
  },

  [BasicField.HomeNo]: {
    label: 'Home number',
    icon: BiPhone,
    isSubmitted: true,
    searchAliases: ['phone', 'contact', 'telephone'],
  },

  [BasicField.LongText]: {
    label: 'Long answer',
    icon: BiAlignLeft,
    isSubmitted: true,
    searchAliases: [
      'text',
      'description',
      'comments',
      'remarks',
      'feedback',
      'notes',
      'details',
      'explanation',
      'paragraph',
    ],
  },

  [BasicField.Mobile]: {
    label: 'Mobile number',
    icon: BiMobile,
    isSubmitted: true,
    searchAliases: ['phone', 'contact', 'telephone', 'sms'],
  },

  [BasicField.Nric]: {
    label: 'NRIC/FIN',
    icon: BiUser,
    isSubmitted: true,
    searchAliases: [
      'id',
      'identification',
      'national',
      'singpass',
      'ic number',
    ],
  },

  [BasicField.Number]: {
    label: 'Number',
    icon: BiHash,
    isSubmitted: true,
    searchAliases: ['age', 'quantity', 'count'],
  },

  [BasicField.Radio]: {
    label: 'Radio',
    icon: BiRadioCircleMarked,
    isSubmitted: true,
    searchAliases: ['choice', 'options', 'mcq', 'multiple'],
  },

  [BasicField.Rating]: {
    label: 'Rating',
    icon: BiStar,
    isSubmitted: true,
    searchAliases: ['satisfaction', 'quality', 'performance'],
  },

  [BasicField.ShortText]: {
    label: 'Short answer',
    icon: BiRename,
    isSubmitted: true,
    searchAliases: ['name', 'text'],
  },

  [BasicField.Table]: {
    label: 'Table',
    icon: BiTable,
    isSubmitted: true,
    searchAliases: [
      'grid',
      'spreadsheet',
      'list',
      'collection',
      'entries',
      'records',
      'items',
      'multiple',
    ],
  },

  [BasicField.Uen]: {
    label: 'UEN',
    icon: BiBuilding,
    isSubmitted: true,
    searchAliases: [
      'id',
      'business',
      'company registration',
      'organization',
      'corporation',
      'unique entity',
      'number',
    ],
  },

  [BasicField.YesNo]: {
    label: 'Yes/No',
    icon: BiToggleLeft,
    isSubmitted: true,
    searchAliases: [
      'consent',
      'agreement',
      'confirmation',
      'approve',
      'approval',
      'accept',
    ],
  },

  [BasicField.Children]: {
    label: 'Children',
    icon: BiGroup,
    isSubmitted: true,
  },
}

const BiDummyIcon = BiCalendar // random icon that is not actually shown in app

export const MYINFO_FIELD_TO_DRAWER_META: {
  [key in MyInfoAttribute]: BuilderSidebarFieldMeta
} = {
  [MyInfoAttribute.Name]: {
    label: 'Name',
    icon: BiUser,
    isSubmitted: true,
  },
  [MyInfoAttribute.Sex]: {
    label: 'Sex',
    icon: BiInfinite,
    isSubmitted: true,
    searchAliases: ['gender'],
  },
  [MyInfoAttribute.DateOfBirth]: {
    label: 'Date of Birth',
    icon: BiCalculator,
    isSubmitted: true,
  },
  [MyInfoAttribute.Race]: {
    label: 'Race',
    icon: BiBody,
    isSubmitted: true,
  },
  [MyInfoAttribute.Nationality]: {
    label: 'Nationality',
    icon: BiGlobe,
    isSubmitted: true,
  },
  [MyInfoAttribute.BirthCountry]: {
    label: 'Birth Country',
    icon: BiFlag,
    isSubmitted: true,
  },
  [MyInfoAttribute.ResidentialStatus]: {
    label: 'Residential Status',
    icon: BiIdCard,
    isSubmitted: true,
  },
  [MyInfoAttribute.Dialect]: {
    label: 'Dialect',
    icon: BiUserVoice,
    isSubmitted: true,
  },
  [MyInfoAttribute.HousingType]: {
    label: 'Housing Type',
    icon: BiHomeAlt,
    isSubmitted: true,
  },
  [MyInfoAttribute.HdbType]: {
    label: 'HDB Type',
    icon: BiHome,
    isSubmitted: true,
  },
  [MyInfoAttribute.PassportNumber]: {
    label: 'Passport Number',
    icon: BiBook,
    isSubmitted: true,
  },
  [MyInfoAttribute.PassportExpiryDate]: {
    label: 'Passport Expiry Date',
    icon: BiCalendarMinus,
    isSubmitted: true,
  },
  [MyInfoAttribute.VehicleNo]: {
    label: 'Vehicle Number',
    icon: BiCar,
    isSubmitted: true,
  },
  [MyInfoAttribute.RegisteredAddress]: {
    label: 'Registered Address',
    icon: BiHomeCircle,
    isSubmitted: true,
  },
  [MyInfoAttribute.MobileNo]: {
    label: 'Mobile Number',
    icon: BiMobile,
    isSubmitted: true,
  },
  [MyInfoAttribute.Occupation]: {
    label: 'Occupation',
    icon: BiBriefcase,
    isSubmitted: true,
  },
  [MyInfoAttribute.Employment]: {
    label: 'Name of Employer',
    icon: BiBookContent,
    isSubmitted: true,
  },
  [MyInfoAttribute.WorkpassStatus]: {
    label: 'Workpass Status',
    icon: BiMap,
    isSubmitted: true,
  },
  [MyInfoAttribute.WorkpassExpiryDate]: {
    label: 'Workpass Expiry Date',
    icon: BiCalendarAlt,
    isSubmitted: true,
  },
  [MyInfoAttribute.Marital]: {
    label: 'Marital Status',
    icon: BiHeartCircle,
    isSubmitted: true,
  },
  [MyInfoAttribute.CountryOfMarriage]: {
    label: 'Country of Marriage',
    icon: BiHomeHeart,
    isSubmitted: true,
  },
  [MyInfoAttribute.MarriageCertNo]: {
    label: 'Marriage Certificate Number',
    icon: BiBookHeart,
    isSubmitted: true,
  },
  [MyInfoAttribute.MarriageDate]: {
    label: 'Marriage Date',
    icon: BiCalendarHeart,
    isSubmitted: true,
  },
  [MyInfoAttribute.DivorceDate]: {
    label: 'Divorce Date',
    icon: BiCalendarX,
    isSubmitted: true,
  },
  [MyInfoAttribute.ChildrenBirthRecords]: {
    label: 'Child Records',
    icon: BiGroup,
    isSubmitted: true,
  },

  // The following child field's icons will never be used.
  // So they can be any placeholder.
  [MyInfoAttribute.ChildBirthCertNo]: {
    label: 'Birth Certificate Number',
    icon: BiDummyIcon,
    isSubmitted: true,
  },
  [MyInfoAttribute.ChildDateOfBirth]: {
    label: 'Date of Birth',
    icon: BiDummyIcon,
    isSubmitted: true,
  },
  [MyInfoAttribute.ChildName]: {
    label: 'Name',
    icon: BiDummyIcon,
    isSubmitted: true,
  },
  [MyInfoAttribute.ChildVaxxStatus]: {
    label: 'Vaccination Requirements',
    icon: BiDummyIcon,
    isSubmitted: true,
  },
  [MyInfoAttribute.ChildGender]: {
    label: 'Sex',
    icon: BiDummyIcon,
    isSubmitted: true,
  },
  [MyInfoAttribute.ChildRace]: {
    label: 'Race',
    icon: BiDummyIcon,
    isSubmitted: true,
  },
  [MyInfoAttribute.ChildSecondaryRace]: {
    label: 'Secondary Race',
    icon: BiDummyIcon,
    isSubmitted: true,
  },
}

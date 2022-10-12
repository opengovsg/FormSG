import {
  BiAlignLeft,
  BiBody,
  BiBook,
  BiBookContent,
  BiBookHeart,
  BiBriefcase,
  BiBuilding,
  BiCalculator,
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

type BuilderSidebarFieldMeta = {
  label: string
  icon: As
  // Is this fieldType included in submissions?
  isSubmitted: boolean
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
  },

  [BasicField.Statement]: {
    label: 'Paragraph',
    icon: BiText,
    isSubmitted: false,
  },

  [BasicField.Section]: {
    label: 'Heading',
    icon: BiHeading,
    isSubmitted: false,
  },

  [BasicField.Attachment]: {
    label: 'Attachment',
    icon: BiCloudUpload,
    isSubmitted: true,
  },

  [BasicField.Checkbox]: {
    label: 'Checkbox',
    icon: BiSelectMultiple,
    isSubmitted: true,
  },

  [BasicField.Date]: {
    label: 'Date',
    icon: BiCalendarEvent,
    isSubmitted: true,
  },

  [BasicField.Decimal]: {
    label: 'Decimal',
    icon: BiCalculator,
    isSubmitted: true,
  },

  [BasicField.Dropdown]: {
    label: 'Dropdown',
    icon: BiCaretDownSquare,
    isSubmitted: true,
  },

  [BasicField.CountryRegion]: {
    label: 'Country/Region',
    icon: BiFlag,
    isSubmitted: true,
  },

  [BasicField.Email]: {
    label: 'Email',
    icon: BiMailSend,
    isSubmitted: true,
  },

  [BasicField.HomeNo]: {
    label: 'Home number',
    icon: BiPhone,
    isSubmitted: true,
  },

  [BasicField.LongText]: {
    label: 'Long answer',
    icon: BiAlignLeft,
    isSubmitted: true,
  },

  [BasicField.Mobile]: {
    label: 'Mobile number',
    icon: BiMobile,
    isSubmitted: true,
  },

  [BasicField.Nric]: {
    label: 'NRIC',
    icon: BiUser,
    isSubmitted: true,
  },

  [BasicField.Number]: {
    label: 'Number',
    icon: BiHash,
    isSubmitted: true,
  },

  [BasicField.Radio]: {
    label: 'Radio',
    icon: BiRadioCircleMarked,
    isSubmitted: true,
  },

  [BasicField.Rating]: {
    label: 'Rating',
    icon: BiStar,
    isSubmitted: true,
  },

  [BasicField.ShortText]: {
    label: 'Short answer',
    icon: BiRename,
    isSubmitted: true,
  },

  [BasicField.Table]: {
    label: 'Table',
    icon: BiTable,
    isSubmitted: true,
  },

  [BasicField.Uen]: {
    label: 'UEN',
    icon: BiBuilding,
    isSubmitted: true,
  },

  [BasicField.YesNo]: {
    label: 'Yes/No',
    icon: BiToggleLeft,
    isSubmitted: true,
  },
}

export const MYINFO_FIELD_TO_DRAWER_META: {
  [key in MyInfoAttribute]: BuilderSidebarFieldMeta
} = {
  [MyInfoAttribute.Name]: {
    label: 'Name',
    icon: BiUser,
    isSubmitted: true,
  },
  [MyInfoAttribute.Sex]: {
    label: 'Gender',
    icon: BiInfinite,
    isSubmitted: true,
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
}

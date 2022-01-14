import {
  BiAlignLeft,
  BiBuilding,
  BiCalculator,
  BiCalendarEvent,
  BiCaretDownSquare,
  BiCloudUpload,
  BiHash,
  BiHeading,
  BiImage,
  BiMailSend,
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
} from 'react-icons/bi'
import { As } from '@chakra-ui/react'

import { BasicField } from '~shared/types/field'

export const ALL_FIELDS_ORDERED = [
  // Page section

  BasicField.Section,

  BasicField.Statement,

  BasicField.Image,

  // Fields section

  BasicField.ShortText,

  BasicField.LongText,

  BasicField.Radio,

  BasicField.Checkbox,

  BasicField.Mobile,

  BasicField.Email,

  BasicField.HomeNo,

  BasicField.Dropdown,

  BasicField.YesNo,

  BasicField.Rating,

  BasicField.Number,

  BasicField.Decimal,

  BasicField.Attachment,

  BasicField.Date,

  BasicField.Table,

  BasicField.Nric,

  BasicField.Uen,
]

export const FIELDS_TO_CREATE_META: Record<
  BasicField,
  { label: string; icon: As }
> = {
  [BasicField.Image]: {
    label: 'Image',

    icon: BiImage,
  },

  [BasicField.Statement]: {
    label: 'Paragraph',

    icon: BiText,
  },

  [BasicField.Section]: {
    label: 'Header',

    icon: BiHeading,
  },

  [BasicField.Attachment]: {
    label: 'Attachment',

    icon: BiCloudUpload,
  },

  [BasicField.Checkbox]: {
    label: 'Checkbox',

    icon: BiSelectMultiple,
  },

  [BasicField.Date]: {
    label: 'Date',

    icon: BiCalendarEvent,
  },

  [BasicField.Decimal]: {
    label: 'Decimal',

    icon: BiCalculator,
  },

  [BasicField.Dropdown]: {
    label: 'Dropdown',

    icon: BiCaretDownSquare,
  },

  [BasicField.Email]: {
    label: 'Email',

    icon: BiMailSend,
  },

  [BasicField.HomeNo]: {
    label: 'Home Number',

    icon: BiPhone,
  },

  [BasicField.LongText]: {
    label: 'Long answer',

    icon: BiAlignLeft,
  },

  [BasicField.Mobile]: {
    label: 'Mobile number',

    icon: BiMobile,
  },

  [BasicField.Nric]: {
    label: 'NRIC',

    icon: BiUser,
  },

  [BasicField.Number]: {
    label: 'Number',

    icon: BiHash,
  },

  [BasicField.Radio]: {
    label: 'Radio',

    icon: BiRadioCircleMarked,
  },

  [BasicField.Rating]: {
    label: 'Rating',

    icon: BiStar,
  },

  [BasicField.ShortText]: {
    label: 'Short answer',

    icon: BiRename,
  },

  [BasicField.Table]: {
    label: 'Table',

    icon: BiTable,
  },

  [BasicField.Uen]: {
    label: 'UEN',

    icon: BiBuilding,
  },

  [BasicField.YesNo]: {
    label: 'Yes/No',

    icon: BiToggleLeft,
  },
}

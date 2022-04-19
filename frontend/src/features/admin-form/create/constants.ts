import {
  BiAlignLeft,
  BiBuilding,
  BiCalculator,
  BiCalendarEvent,
  BiCaretDownSquare,
  BiCloudUpload,
  BiGlobe,
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

type BuilderSidebarFieldMeta = {
  label: string
  icon: As
  // Is this fieldType included in submissions?
  isSubmitted: boolean
}

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
    label: 'Header',
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

  [BasicField.Country]: {
    label: 'Country',
    icon: BiGlobe,
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

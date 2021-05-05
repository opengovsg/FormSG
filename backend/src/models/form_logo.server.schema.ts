import { Schema } from 'mongoose'

import {
  FormLogoState,
  ICustomFormLogoSchema,
  IFormLogoSchema,
} from 'src/types'

export const FormLogoSchema = new Schema<IFormLogoSchema>(
  {
    state: {
      type: String,
      enum: Object.values(FormLogoState),
      default: FormLogoState.Default,
      required: true,
    },
  },
  {
    _id: false,
    discriminatorKey: 'state',
  },
)

export const CustomFormLogoSchema = new Schema<ICustomFormLogoSchema>(
  {
    // fileId is of the format: `${Date.now()}-${fileName}`
    fileId: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSizeInBytes: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  },
)

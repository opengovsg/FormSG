import { Schema } from 'mongoose'

import { ITimeFieldSchema } from '../../../types/field'

const createTimeFieldSchema = () => {
  return new Schema<ITimeFieldSchema>({
    // Both settings govern the input widget only. Answers are always persisted
    // as canonical 24-hour HH:MM:SS, so changing either never invalidates an
    // existing submission or reshapes an export column.
    includeSeconds: {
      type: Boolean,
      default: false,
    },
    use24HourFormat: {
      type: Boolean,
      default: true,
    },
  })
}

export default createTimeFieldSchema

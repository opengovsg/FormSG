import { BasicField, BookingFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IBookingFieldSchema extends BookingFieldBase, IFieldSchema {
  fieldType: BasicField.Booking
}

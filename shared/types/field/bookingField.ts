import { BasicField, FieldBase } from './base'

export interface BookingFieldBase extends FieldBase {
  fieldType: BasicField.Booking
  eventCode: string
}

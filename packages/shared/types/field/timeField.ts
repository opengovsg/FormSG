import { BasicField, FieldBase } from './base'

export interface TimeFieldBase extends FieldBase {
  fieldType: BasicField.Time
  /**
   * Whether the respondent enters a seconds component. Does NOT affect how the
   * answer is stored — answers are always persisted at full `HH:MM:SS` precision,
   * with seconds normalised to `00` when this is false.
   */
  includeSeconds: boolean
}

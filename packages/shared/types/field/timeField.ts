import { BasicField, FieldBase } from './base'

export interface TimeFieldBase extends FieldBase {
  fieldType: BasicField.Time
  /**
   * Whether the respondent enters a seconds component.
   *
   * Presentation only. Answers are always persisted at full `HH:MM:SS`
   * precision, with seconds normalised to `00` when this is false — so
   * flipping it never invalidates existing submissions or changes the shape of
   * an export column.
   */
  includeSeconds: boolean
  /**
   * Whether the respondent enters the time on a 24-hour clock. When false the
   * input offers a 1-12 hour with an AM/PM toggle.
   *
   * Presentation only, for the same reason as `includeSeconds`: the input
   * converts to canonical 24-hour form before submitting, so nothing
   * meridiem-shaped ever reaches storage. A stored answer therefore carries no
   * trace of which setting was in force when it was given.
   */
  use24HourFormat: boolean
}

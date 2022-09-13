import { InputProps } from '@chakra-ui/react'

export interface DatePickerBaseProps
  extends Omit<
    InputProps,
    'value' | 'defaultValue' | 'onChange' | 'colorScheme'
  > {
  /**
   * The `date-fns` format to display the date.
   * @defaultValue `dd/MM/yyyy`
   */
  displayFormat?: string
  /**
   * The `date-fns` format to parse manual string input.
   * @defaultValue `dd/MM/yyyy`
   */
  dateFormat?: string
  /** Whether the input allows manual date entry. */
  allowManualInput?: boolean
  /** If `true`, will allow invalid dates to be set for external validation.
   * @defaultValue `true`
   */
  allowInvalidDates?: boolean
  /** Whether the calendar will close once a date is selected. Defaults to `true` */
  closeCalendarOnChange?: boolean
  /** Locale of the date to be applied if provided. */
  locale?: Locale
}

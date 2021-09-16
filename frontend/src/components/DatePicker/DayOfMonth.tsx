import { useMemo } from 'react'
import {
  Box,
  BoxProps,
  forwardRef,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { merge } from 'lodash'

import { DATE_INPUT_THEME_KEY } from '~theme/components/DateInput'

export interface DayOfMonthProps extends BoxProps {
  /**
   * Date represented by this day of month.
   */
  date: Date
  /**
   * Whether this date is currently selected.
   */
  isSelected?: boolean
  /**
   * Whether this date is available to be selected.
   */
  isAvailable?: boolean
  /**
   * Whether this date is the current date.
   */
  isToday?: boolean
  /**
   * Whether this date falls outside the range of the
   * month currently being displayed.
   */
  isOutsideCurrMonth?: boolean
  /**
   * Whether this date should be placed in the tabbing
   * sequence.
   */
  isFocusable?: boolean
}

export const DayOfMonth = forwardRef<DayOfMonthProps, 'button'>(
  (
    {
      date,
      isSelected,
      isAvailable,
      isToday,
      isOutsideCurrMonth,
      isFocusable,
      ...props
    },
    ref,
  ) => {
    const styles = useMultiStyleConfig(DATE_INPUT_THEME_KEY, {})

    const customStyles = useMemo(() => {
      const todayColour =
        // Hyphen rather than . because they will be placed inside var()
        isOutsideCurrMonth || !isAvailable ? 'secondary-300' : 'primary-500'
      return {
        _hover: {
          backgroundColor: isSelected ? 'primary.500' : 'primary.200',
        },
        backgroundColor: isSelected ? 'primary.500' : 'transparent',
        color:
          isOutsideCurrMonth || !isAvailable
            ? 'secondary.300'
            : isSelected
            ? 'white'
            : 'secondary.500',
        // The !important for boxShadow is necessary because when Dayzed tries
        // to focus an element when the data-focus-visible attributes are not present
        // (e.g. when opening the datepicker by clicking rather than hitting space/enter),
        // Chakra UI adds an overriding box-shadow: none style.
        boxShadow: `inset 0 0 0 0.0625rem ${
          isToday ? `var(--chakra-colors-${todayColour})` : 'transparent'
        } !important`,
        _focus: {
          boxShadow: `inset 0 0 0 0.0625rem ${
            isToday ? `var(--chakra-colors-${todayColour})` : 'transparent'
          }, 0 0 0 0.25rem var(--chakra-colors-primary-300) !important`,
        },
      }
    }, [isSelected, isAvailable, isToday, isOutsideCurrMonth])

    return (
      <Box
        as="button"
        {...props}
        __css={merge(styles.dayOfMonth, customStyles)}
        aria-label={format(date, "do 'of' MMMM',' EEEE")}
        disabled={!isAvailable}
        tabIndex={isFocusable ? 0 : -1}
        ref={ref}
      >
        {date.getDate()}
      </Box>
    )
  },
)

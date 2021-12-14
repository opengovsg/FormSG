import { anatomy, getColor } from '@chakra-ui/theme-tools'

import { ComponentMultiStyleConfig } from '~theme/types'

export const DATE_INPUT_THEME_KEY = 'DateInput'

const parts = anatomy('dateinput').parts(
  'container', // overall container
  'monthYearSelectorContainer', // container for month, year dropdowns and arrows
  'monthYearDropdownContainer', // container for month, year dropdowns
  'monthArrowContainer', // container for month forward/backward arrows
  'calendarContainer', // container for all month grids
  'monthGrid', // grid of dates for a single month
  'dayNamesContainer', // container for names of days in the week
  'dayOfMonth', // container for single date
  'todayLinkContainer', // container for "Today" link
)

export const DateInput: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  baseStyle: ({
    isToday,
    isOutsideCurrMonth,
    isSelected,
    colorScheme: c,
    theme,
  }) => {
    return {
      container: {
        display: 'inline-block',
        py: '1rem',
      },
      monthYearSelectorContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        py: '0.375rem',
      },
      monthYearDropdownContainer: {
        display: 'flex',
        justifyContent: 'flex-start',
      },
      monthArrowContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
      },
      calendarContainer: {
        py: '1rem',
        borderY: '1px solid',
        borderColor: 'neutral.300',
      },
      monthGrid: {
        rowGap: '0.5rem',
        display: 'inline-grid',
        justifyItems: 'left',
      },
      dayNamesContainer: {
        textStyle: 'subhead-2',
        color: 'secondary.700',
        margin: 'auto',
      },
      dayOfMonth: {
        transitionDuration: 'normal',
        display: 'inline-block',
        textStyle: 'body-1',
        borderRadius: '1.5rem',
        color: isSelected
          ? 'white'
          : isOutsideCurrMonth
          ? 'secondary.300'
          : 'secondary.500',
        p: {
          base: 0,
          md: 0.75,
        },
        outline: 'none',
        border: '1px solid',
        borderColor: isToday
          ? isOutsideCurrMonth
            ? 'secondary.300'
            : `${c}.500`
          : 'transparent',
        bg: isSelected ? `${c}.500` : 'transparent',
        _hover: {
          bg: isSelected ? `${c}.500` : `${c}.200`,
        },
        _focus: {
          boxShadow: `0 0 0 4px ${getColor(theme, `${c}.300`)}`,
        },
        _disabled: {
          color: 'secondary.300',
          cursor: 'not-allowed',
          bg: 'transparent',
        },
        w: {
          base: '2rem',
          md: '3rem',
        },
        h: {
          base: '2rem',
          md: '3rem',
        },
        mx: '0.25rem',
      },
      todayLinkContainer: {
        textAlign: 'center',
        pt: '1rem',
      },
    }
  },
  defaultProps: {
    colorScheme: 'primary',
  },
}

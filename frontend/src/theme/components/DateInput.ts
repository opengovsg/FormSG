import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export const DATE_INPUT_THEME_KEY = 'DateInput'

const parts = [
  'container', // overall container
  'monthYearSelectorContainer', // container for month, year dropdowns and arrows
  'monthYearDropdownContainer', // container for month, year dropdowns
  'monthArrowContainer', // container for month forward/backward arrows
  'calendarContainer', // container for all month grids
  'monthGrid', // grid of dates for a single month
  'dayNamesContainer', // container for names of days in the week
  'dayOfMonth', // container for single date
  'todayLinkContainer', // container for "Today" link
]

export const DateInput: ComponentMultiStyleConfig = {
  parts,
  baseStyle: {
    container: {
      display: 'inline-block',
      py: '1rem',
    },
    monthYearSelectorContainer: {
      display: 'flex',
      justifyContent: 'space-between',
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
      display: 'inline-block',
      textStyle: 'body-1',
      borderRadius: '1.5rem',
      padding: {
        base: 0,
        md: 0.75,
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
      _focus: {
        outline: 'none',
      },
    },
    todayLinkContainer: {
      textAlign: 'center',
      pt: '1rem',
    },
  },
}

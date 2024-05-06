import {
  createMultiStyleConfigHelpers,
  StyleFunctionProps,
} from '@chakra-ui/react'
import { anatomy } from '@chakra-ui/theme-tools'

const parts = anatomy('calendar').parts(
  'container', // overall container
  'monthYearSelectorContainer', // container for month, year dropdowns and arrows
  'monthYearSelect', // select for month and year
  'monthYearDisplay', // container for month and year text
  'monthYearDropdownContainer', // container for month, year dropdowns
  'monthArrowContainer', // container for month forward/backward arrows
  'calendarContainer', // container for all month grids
  'monthGrid', // grid of dates for a single month
  'dayNamesContainer', // container for names of days in the week
  'dayOfMonthContainer',
  'dayOfMonth', // container for single date
  'todayLinkContainer', // container for "Today" link,
  'todayLink', // "Today" link
  'fillerRow', // Filler row for months with only 5 weeks displayed.
)

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys)

const getDayOfMonthColors = ({
  isToday,
  colorScheme: c,
  isOutsideCurrMonth,
}: StyleFunctionProps) => {
  switch (c) {
    case 'main':
      return {
        color: isOutsideCurrMonth
          ? 'interaction.support.disabled-content'
          : 'base.content.strong',
        activeColor: 'base.content.inverse',
        hoverBg: 'interaction.muted.main.hover',
        activeBg: 'interaction.main.default',
        selectedBg: 'interaction.muted.main.active',
        borderColor: isToday ? 'utility.focus-default' : 'transparent',
      }
    default: {
      return {
        color: isOutsideCurrMonth
          ? 'brand.secondary.300'
          : 'brand.secondary.500',
        activeColor: 'base.content.inverse',
        selectedBg: `${c}.200`,
        hoverBg: `${c}.200`,
        activeBg: `${c}.500`,
        borderColor: isToday ? `${c}.500` : 'transparent',
      }
    }
  }
}

const variantForm = definePartsStyle((props) => {
  const { color, activeBg, borderColor, activeColor, hoverBg, selectedBg } =
    getDayOfMonthColors(props)

  return {
    dayOfMonth: {
      color,
      borderColor,
      _hover: {
        bg: hoverBg,
      },
      _active: {
        bg: activeBg,
        color: activeColor,
      },
      _selected: {
        bg: selectedBg,
      },
      _disabled: {
        _hover: {
          bg: hoverBg,
        },
      },
    },
  }
})

const variants = {
  form: variantForm,
}

export const Calendar = defineMultiStyleConfig({
  variants,
  defaultProps: {
    variant: 'form',
  },
})

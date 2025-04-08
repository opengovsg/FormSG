import { Flex, forwardRef, Popover, PopoverAnchor } from '@chakra-ui/react'

import { useDatePicker } from '../DatePickerContext'

import { DatePickerInput } from './DatePickerInput'

export const DatePickerWrapper = forwardRef<
  { highContrast?: boolean },
  'input'
>(({ highContrast, children }, ref) => {
  const { disclosureProps, initialFocusRef, closeCalendarOnChange, isMobile } =
    useDatePicker()

  if (isMobile) {
    return (
      <Flex>
        <DatePickerInput ref={ref} highContrast={highContrast} />
        {children}
      </Flex>
    )
  }

  return (
    <Flex>
      <Popover
        placement="bottom-start"
        isLazy
        initialFocusRef={initialFocusRef}
        closeOnBlur={closeCalendarOnChange}
        returnFocusOnClose={false}
        {...disclosureProps}
      >
        <PopoverAnchor>
          <DatePickerInput ref={ref} highContrast={highContrast} />
        </PopoverAnchor>
        {children}
      </Popover>
    </Flex>
  )
})

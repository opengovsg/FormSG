import { Flex, forwardRef, Popover, PopoverAnchor } from '@chakra-ui/react'

import { useDatePicker } from '../DatePickerContext'

import { DatePickerInput } from './DatePickerInput'

// eslint-disable-next-line @typescript-eslint/ban-types
export const DatePickerWrapper = forwardRef<{}, 'input'>(
  ({ children }, ref) => {
    const {
      styles,
      disclosureProps,
      initialFocusRef,
      closeCalendarOnChange,
      isMobile,
    } = useDatePicker()

    if (isMobile) {
      return (
        <Flex>
          <Flex sx={styles.fieldwrapper}>
            <DatePickerInput ref={ref} />
          </Flex>
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
            <Flex sx={styles.fieldwrapper}>
              <DatePickerInput ref={ref} />
            </Flex>
          </PopoverAnchor>
          {children}
        </Popover>
      </Flex>
    )
  },
)

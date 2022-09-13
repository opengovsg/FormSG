import { forwardRef } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'

import { DatePicker, DatePickerProps } from './DatePicker'
import { MobileDatePicker } from './MobileDatePicker'

export const DatePickerContainer = forwardRef<DatePickerProps, 'input'>(
  (props, ref) => {
    const isMobile = useIsMobile()
    if (isMobile) {
      return <MobileDatePicker ref={ref} {...props} />
    }
    return <DatePicker ref={ref} {...props} />
  },
)

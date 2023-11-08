import { BxCalendar } from '~assets/icons'
import IconButton from '~components/IconButton'

import { useDatePicker } from '../DatePickerContext'

export const CalendarButton = (): JSX.Element => {
  const {
    disclosureProps: { onOpen, isOpen },
    calendarButtonAria,
    fcProps: { isDisabled, isReadOnly },
  } = useDatePicker()
  return (
    <IconButton
      onClick={onOpen}
      aria-label={calendarButtonAria}
      icon={<BxCalendar />}
      variant="inputAttached"
      borderLeftColor={'transparent'}
      borderLeftRadius={0}
      isActive={isOpen}
      isDisabled={isDisabled || isReadOnly}
    />
  )
}

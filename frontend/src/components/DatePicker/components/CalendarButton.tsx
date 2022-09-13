import { BxCalendar } from '~assets/icons'
import IconButton from '~components/IconButton'

import { useDatePicker } from '../DatePickerContext'

export const CalendarButton = (): JSX.Element => {
  const {
    disclosureProps: { onOpen, isOpen },
    colorScheme,
    calendarButtonAria,
    fcProps: { isDisabled, isReadOnly },
  } = useDatePicker()
  return (
    <IconButton
      onClick={onOpen}
      colorScheme={colorScheme}
      aria-label={calendarButtonAria}
      icon={<BxCalendar />}
      variant="inputAttached"
      borderRadius={0}
      isActive={isOpen}
      isDisabled={isDisabled || isReadOnly}
    />
  )
}

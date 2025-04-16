import { BxCalendar } from '~assets/icons'
import IconButton from '~components/IconButton'

import { useDatePicker } from '../DatePickerContext'

export const CalendarButton = (): JSX.Element => {
  const {
    disclosureProps: { onOpen, isOpen },
    calendarButtonAria,
    fcProps: { isDisabled, isReadOnly },
    isHighContrast,
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
      sx={
        isHighContrast
          ? {
              bg: 'neutral.200',
              color: 'neutral.800',
              borderColor: 'neutral.400',
              _hover: {
                bg: 'neutral.200',
                color: 'neutral.800',
                borderColor: 'neutral.400',
              },
              '& svg': {
                stroke: 'neutral.400',
                fill: 'neutral.800',
              },
            }
          : undefined
      }
    />
  )
}

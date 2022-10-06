import { DatePickerContentBase } from '~components/DatePicker/components/DatePickerContentBase'

import { useDateRangePicker } from '../DateRangePickerContext'

export const DateRangePickerContent = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const {
    isMobile,
    disclosureProps: { isOpen, onClose },
    initialFocusRef,
  } = useDateRangePicker()

  return (
    <DatePickerContentBase
      isMobile={isMobile}
      isOpen={isOpen}
      onClose={onClose}
      initialFocusRef={initialFocusRef}
    >
      {children}
    </DatePickerContentBase>
  )
}

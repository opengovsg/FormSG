import { useDatePicker } from '../DatePickerContext'

import { DatePickerContentBase } from './DatePickerContentBase'

export const DatePickerContent = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const {
    isMobile,
    disclosureProps: { isOpen, onClose },
    initialFocusRef,
  } = useDatePicker()
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

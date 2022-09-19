import ReactInputMask from 'react-input-mask'
import { forwardRef, useMergeRefs } from '@chakra-ui/react'

import Input from '~components/Input'

import { useDatePicker } from '../DatePickerContext'

// eslint-disable-next-line @typescript-eslint/ban-types
export const DatePickerInput = forwardRef<{}, 'input'>((_props, ref) => {
  const {
    styles,
    internalInputValue,
    handleInputChange,
    handleInputBlur,
    handleInputClick,
    fcProps,
    allowManualInput,
    placeholder,
    inputRef,
  } = useDatePicker()

  const mergedInputRef = useMergeRefs(inputRef, ref)

  return (
    <Input
      variant="unstyled"
      sx={styles.field}
      as={ReactInputMask}
      mask="99/99/9999"
      value={internalInputValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      maskPlaceholder={placeholder}
      ref={mergedInputRef}
      {...fcProps}
      borderRightRadius={0}
      onBlur={handleInputBlur}
      onClick={handleInputClick}
      isReadOnly={fcProps.isReadOnly || !allowManualInput}
    />
  )
})

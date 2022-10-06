import { useMemo } from 'react'
import ReactInputMask from 'react-input-mask'
import { forwardRef, useMergeRefs, VisuallyHidden } from '@chakra-ui/react'

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
    internalValue,
  } = useDatePicker()

  const mergedInputRef = useMergeRefs(inputRef, ref)

  const selectedDateAriaLiveText = useMemo(() => {
    if (!internalValue) {
      return 'No date selected'
    }

    return `Selected date: ${internalValue.toLocaleDateString()}`
  }, [internalValue])

  return (
    <>
      <VisuallyHidden aria-live="assertive">
        {selectedDateAriaLiveText}
      </VisuallyHidden>
      <Input
        variant="unstyled"
        inputMode="numeric" // Nudge Android mobile keyboard to be numeric
        pattern="\d*" // Nudge numeric keyboard on iOS Safari.
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
    </>
  )
})

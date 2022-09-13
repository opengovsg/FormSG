import ReactInputMask from 'react-input-mask'
import { Flex, forwardRef, Stack, Text, useMergeRefs } from '@chakra-ui/react'

import Input from '~components/Input'

import { useDateRangePicker } from '../DateRangePickerContext'

// eslint-disable-next-line @typescript-eslint/ban-types
export const DateRangePickerInput = forwardRef<{}, 'input'>((_props, ref) => {
  const {
    startInputRef,
    styles,
    startInputDisplay,
    handleStartDateChange,
    displayFormat,
    fcProps,
    handleInputBlur,
    handleInputClick,
    allowManualInput,
    labelSeparator,
    endInputDisplay,
    endInputRef,
    handleEndDateChange,
  } = useDateRangePicker()

  const mergedStartInputRef = useMergeRefs(startInputRef, ref)

  return (
    <Flex
      overflowX="auto"
      sx={{
        // Hide scrollbars so dual inputs feel like a real normal input.
        '-ms-overflow-style': 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      <Stack direction="row" align="center">
        <Input
          variant="unstyled"
          aria-label="Start date of range"
          sx={styles.field}
          width="6rem"
          as={ReactInputMask}
          mask="99/99/9999"
          value={startInputDisplay}
          onChange={handleStartDateChange}
          placeholder={displayFormat.toLowerCase()}
          maskPlaceholder={displayFormat.toLowerCase()}
          ref={mergedStartInputRef}
          {...fcProps}
          borderRightRadius={0}
          onBlur={handleInputBlur}
          onClick={handleInputClick}
          isReadOnly={fcProps.isReadOnly || !allowManualInput}
        />
        <Text color="secondary.400">{labelSeparator}</Text>
        <Input
          variant="unstyled"
          aria-label="Start date of range"
          sx={styles.field}
          width="6rem"
          as={ReactInputMask}
          mask="99/99/9999"
          value={endInputDisplay}
          onChange={handleEndDateChange}
          placeholder={displayFormat.toLowerCase()}
          maskPlaceholder={displayFormat.toLowerCase()}
          onClick={handleInputClick}
          ref={endInputRef}
          {...fcProps}
          borderRightRadius={0}
          onBlur={handleInputBlur}
          isReadOnly={fcProps.isReadOnly || !allowManualInput}
        />
      </Stack>
    </Flex>
  )
})

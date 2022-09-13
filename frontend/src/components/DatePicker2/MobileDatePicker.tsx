import InputMask from 'react-input-mask'
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  forwardRef,
  Text,
  useDisclosure,
  useMergeRefs,
} from '@chakra-ui/react'

import { BxCalendar } from '~assets/icons'
import { Calendar } from '~components/Calendar'
import { DrawerCloseButton } from '~components/Drawer'
import IconButton from '~components/IconButton'
import Input from '~components/Input'

import { DatePickerProps } from './DatePicker'
import { useDatePicker } from './useDatePicker'

export const MobileDatePicker = forwardRef<DatePickerProps, 'input'>(
  (props, ref) => {
    const {
      initialFocusRef,
      inputRef,
      styles,
      InputTriggerOrFragment,
      handleInputChange,
      handleInputBlur,
      handleDateChange,
      internalValue,
      internalInputValue,
      calendarButtonAria,
      fcProps,
      displayFormat,
      allowManualInput,
      colorScheme,
      isDateUnavailable,
    } = useDatePicker(props)
    const mergedInputRef = useMergeRefs(inputRef, ref)

    const { isOpen, onClose, onOpen } = useDisclosure()

    return (
      <Flex>
        <Flex sx={styles.fieldwrapper}>
          <InputTriggerOrFragment>
            <Input
              variant="unstyled"
              sx={styles.field}
              as={InputMask}
              mask="99/99/9999"
              value={internalInputValue}
              onChange={handleInputChange}
              placeholder={displayFormat.toLowerCase()}
              maskPlaceholder={displayFormat.toLowerCase()}
              ref={mergedInputRef}
              {...fcProps}
              borderRightRadius={0}
              onBlur={handleInputBlur}
              isReadOnly={fcProps.isReadOnly || !allowManualInput}
            />
          </InputTriggerOrFragment>
        </Flex>
        <IconButton
          colorScheme={colorScheme}
          aria-label={calendarButtonAria}
          icon={<BxCalendar />}
          variant="inputAttached"
          borderRadius={0}
          isActive={isOpen}
          isDisabled={fcProps.isDisabled || fcProps.isReadOnly}
          onClick={onOpen}
        />
        <Drawer
          isOpen={isOpen}
          placement="bottom"
          onClose={onClose}
          initialFocusRef={initialFocusRef}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton colorScheme="secondary" />
            <Flex
              h="3.5rem"
              px={{ base: '1rem', md: '1.5rem' }}
              justifyContent="space-between"
              alignItems="center"
              borderBottom="1px solid"
              borderColor="neutral.300"
            >
              <Text textStyle="subhead-2" color="secondary.500">
                Select a date
              </Text>
            </Flex>
            <Calendar
              colorScheme={colorScheme}
              value={internalValue ?? undefined}
              isDateUnavailable={isDateUnavailable}
              onChange={handleDateChange(onClose)}
              ref={initialFocusRef}
            />
          </DrawerContent>
        </Drawer>
      </Flex>
    )
  },
)

// Pure component for reusability
import ReactFocusLock from 'react-focus-lock'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  Portal,
  Text,
} from '@chakra-ui/react'

import { DrawerCloseButton } from '~components/Drawer'
import { PopoverCloseButton } from '~components/Popover'

interface DatePickerContentBaseProps {
  children: React.ReactNode
  isMobile: boolean
  isOpen: boolean
  onClose: () => void
  initialFocusRef: React.RefObject<HTMLElement>
}

export const DatePickerContentBase = ({
  children,
  isMobile,
  isOpen,
  onClose,
  initialFocusRef,
}: DatePickerContentBaseProps): JSX.Element => {
  if (isMobile) {
    return (
      <Drawer
        isOpen={isOpen}
        placement="bottom"
        onClose={onClose}
        initialFocusRef={initialFocusRef}
      >
        <DrawerOverlay />
        <DrawerContent maxH="100%" overflow="auto">
          <DrawerCloseButton colorScheme="secondary" />
          <DrawerHeader
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
          </DrawerHeader>
          {children}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Portal>
      <PopoverContent borderRadius="4px" w="unset" maxW="100vw" bg="white">
        <ReactFocusLock>
          <PopoverHeader
            h="3.5rem"
            display="flex"
            px={{ base: '1rem', md: '1.5rem' }}
            justifyContent="space-between"
            alignItems="center"
            textStyle="subhead-2"
            color="secondary.500"
          >
            Select a date
            <PopoverCloseButton position="initial" />
          </PopoverHeader>
          <PopoverBody p={0}>{children}</PopoverBody>
        </ReactFocusLock>
      </PopoverContent>
    </Portal>
  )
}

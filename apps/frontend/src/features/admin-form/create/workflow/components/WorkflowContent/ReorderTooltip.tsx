import { useRef } from 'react'
import {
  Box,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
} from '@chakra-ui/react'

import Button from '~components/Button'

interface ReorderTooltipProps {
  isOpen: boolean
  onDismiss: () => void
  children: React.ReactNode
}

export const ReorderTooltip = ({
  isOpen,
  onDismiss,
  children,
}: ReorderTooltipProps): JSX.Element => {
  const triggerRef = useRef<HTMLDivElement>(null)

  return (
    <Popover
      isOpen={isOpen}
      placement="right"
      closeOnBlur={false}
      initialFocusRef={triggerRef}
    >
      <PopoverTrigger>
        <Box ref={triggerRef}>{children}</Box>
      </PopoverTrigger>
      <PopoverContent
        bg="secondary.700"
        color="white"
        borderColor="secondary.700"
        maxW="16rem"
      >
        <PopoverArrow bg="secondary.700" />
        <PopoverBody p="0.75rem">
          <Text textStyle="body-2" mb="0.75rem">
            You can add steps in between or drag the steps to rearrange them.
          </Text>
          <Button
            size="sm"
            variant="outline"
            colorScheme="whiteAlpha"
            color="white"
            borderColor="whiteAlpha.400"
            _hover={{ bg: 'whiteAlpha.200' }}
            onClick={onDismiss}
          >
            OK
          </Button>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

// localStorage helpers
const TOOLTIP_KEY_PREFIX = 'workflow_reorder_tooltip_seen_'

export const hasSeenReorderTooltip = (formId: string): boolean => {
  try {
    return localStorage.getItem(`${TOOLTIP_KEY_PREFIX}${formId}`) === 'true'
  } catch {
    return false
  }
}

export const markReorderTooltipSeen = (formId: string): void => {
  try {
    localStorage.setItem(`${TOOLTIP_KEY_PREFIX}${formId}`, 'true')
  } catch {
    // localStorage may be unavailable
  }
}

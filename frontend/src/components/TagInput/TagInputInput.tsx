import { KeyboardEventHandler, useCallback, useRef } from 'react'
import { useFocusEffect, useRovingTabIndex } from 'react-roving-tabindex'
import { chakra, forwardRef, useMergeRefs } from '@chakra-ui/react'

import { InputProps } from '~components/Input'

export const TagInputInput = forwardRef<Omit<InputProps, 'size'>, 'input'>(
  ({ onKeyDown, ...props }, ref) => {
    // The ref of the input to be controlled.
    const focusedRef = useRef<HTMLElement>(null)

    const mergedRefs = useMergeRefs(ref, focusedRef)

    // handleKeyDown and handleClick are stable for the lifetime of the component:
    const [tabIndex, focused, handleRovingKeyDown, handleClick] =
      useRovingTabIndex(
        focusedRef,
        /* disabled= */ false, // But change this as you like throughout the lifetime of the component.
      )
    // Set focus on the input if it gets focus
    useFocusEffect(focused, focusedRef)

    const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
      (event) => {
        onKeyDown?.(event)
        // Only allow roving if the input is empty.
        if (!event.currentTarget.value) {
          handleRovingKeyDown(event)
        }
      },
      [handleRovingKeyDown, onKeyDown],
    )

    return (
      <chakra.input
        flexGrow={1}
        py="0.25rem"
        pl="0.5rem"
        {...props}
        ref={mergedRefs}
        tabIndex={tabIndex}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      />
    )
  },
)

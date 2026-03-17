import {
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useRef,
} from 'react'
import { useFocusEffect, useRovingTabIndex } from 'react-roving-tabindex'
import { chakra, forwardRef, useMergeRefs } from '@chakra-ui/react'

import { InputProps } from '~components/Input'

import { useTagInputStyles } from './TagInputProvider'

export const TagInputInput = forwardRef<Omit<InputProps, 'size'>, 'input'>(
  (
    { onKeyDown, isDisabled = false, isReadOnly, isInvalid, onClick, ...props },
    ref,
  ) => {
    const styles = useTagInputStyles()
    // The ref of the input to be controlled.
    const focusedRef = useRef<HTMLElement>(null)

    const mergedRefs = useMergeRefs(ref, focusedRef)

    // handleKeyDown and handleClick are stable for the lifetime of the component:
    const [tabIndex, focused, handleRovingKeyDown, handleRovingClick] =
      useRovingTabIndex(focusedRef, isDisabled)

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

    const handleClick: MouseEventHandler<HTMLInputElement> = useCallback(
      (event) => {
        onClick?.(event)
        handleRovingClick()
      },
      [handleRovingClick, onClick],
    )

    return (
      <chakra.input
        disabled={isDisabled}
        readOnly={isReadOnly}
        aria-invalid={isInvalid}
        sx={styles.field}
        {...props}
        ref={mergedRefs}
        tabIndex={tabIndex}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      />
    )
  },
)

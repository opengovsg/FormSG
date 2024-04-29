import {
  KeyboardEventHandler,
  SyntheticEvent,
  useCallback,
  useRef,
} from 'react'
import { useFocusEffect, useRovingTabIndex } from 'react-roving-tabindex'
import { TagLabel } from '@chakra-ui/react'

import { Tag, TagCloseButton, TagProps } from '~components/Tag/Tag'

export interface TagInputTagProps extends TagProps {
  isDisabled?: boolean
  isInvalid?: boolean
  label: string
  onClearTag: (event: SyntheticEvent) => void
  onBlur?: (event: SyntheticEvent) => void
}

export const TagInputTag = ({
  label,
  isDisabled = false,
  isInvalid,
  colorScheme,
  onClearTag,
  onBlur,
  ...props
}: TagInputTagProps) => {
  // The ref of the input to be controlled.
  const focusedRef = useRef<HTMLElement>(null)

  // handleKeyDown and handleClick are stable for the lifetime of the component:
  const [tabIndex, focused, handleRovingKeyDown, handleRovingClick] =
    useRovingTabIndex(focusedRef, isDisabled)

  // Set focus on the tag if it gets focus.
  useFocusEffect(focused, focusedRef)

  const handleClick = useCallback(
    (event: SyntheticEvent) => {
      handleRovingClick()
      event.stopPropagation()
    },
    [handleRovingClick],
  )

  const handleCloseButtonClick = useCallback(
    (event: SyntheticEvent) => {
      onClearTag(event)
      onBlur?.(event)
      event.stopPropagation()
    },
    [onBlur, onClearTag],
  )

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          return onClearTag(event)
      }
      handleRovingKeyDown(event)
    },
    [handleRovingKeyDown, onClearTag],
  )

  return (
    <Tag
      cursor="pointer"
      aria-disabled={isDisabled}
      aria-invalid={isInvalid}
      colorScheme={isInvalid ? 'danger' : colorScheme}
      {...props}
      ref={focusedRef}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      <TagLabel title={label} noOfLines={1}>
        {label}
      </TagLabel>
      <TagCloseButton
        tabIndex={-1}
        isDisabled={isDisabled}
        onClick={handleCloseButtonClick}
      />
    </Tag>
  )
}

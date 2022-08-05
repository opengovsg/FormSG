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
  onClose: (event: SyntheticEvent) => void
}

export const TagInputTag = ({
  label,
  onClose,
  isDisabled = false,
  isInvalid,
  colorScheme,
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

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          return onClose(event)
      }
      handleRovingKeyDown(event)
    },
    [handleRovingKeyDown, onClose],
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
      <TagLabel title={label} isTruncated>
        {label}
      </TagLabel>
      <TagCloseButton tabIndex={-1} isDisabled={isDisabled} onClick={onClose} />
    </Tag>
  )
}

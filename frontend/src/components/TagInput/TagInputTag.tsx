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
  label: string
  onClose: (event: SyntheticEvent) => void
}

export const TagInputTag = ({ label, onClose, ...props }: TagInputTagProps) => {
  // The ref of the input to be controlled.
  const focusedRef = useRef<HTMLElement>(null)

  // handleKeyDown and handleClick are stable for the lifetime of the component:
  const [tabIndex, focused, handleRovingKeyDown, handleClick] =
    useRovingTabIndex(focusedRef, /* disabled= */ false)

  // Set focus on the tag if it gets focus.
  useFocusEffect(focused, focusedRef)

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
      {...props}
      ref={focusedRef}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      <TagLabel noOfLines={1}>{label}</TagLabel>
      <TagCloseButton tabIndex={-1} onClick={onClose} />
    </Tag>
  )
}

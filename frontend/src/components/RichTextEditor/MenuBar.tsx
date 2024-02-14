import React from 'react'
import { useCurrentEditor } from '@tiptap/react'

import { BxsBold } from '~assets/icons/BxsBold'
import { BxsHeading } from '~assets/icons/BxsHeading'
import { BxsItalic } from '~assets/icons/BxsItalic'
import { BxsOrderedList } from '~assets/icons/BxsOrderedList'
import { BxsRedo } from '~assets/icons/BxsRedo'
import { BxsStrikethrough } from '~assets/icons/BxsStrikethrough'
import { BxsUndo } from '~assets/icons/BxsUndo'
import { BxsUnorderedList } from '~assets/icons/BxsUnorderedList'
import ButtonGroup from '~components/ButtonGroup'

import IconButtonComponent from '../IconButton'

const IconButton = ({
  ariaLabel,
  disabled,
  icon,
  onClick,
  active,
}: {
  ariaLabel: string
  disabled: boolean
  icon: JSX.Element
  onClick: () => void
  active?: boolean
}): JSX.Element => {
  return (
    <IconButtonComponent
      aria-label={ariaLabel}
      icon={icon}
      isDisabled={disabled}
      isActive={active}
      variant="clear"
      onClick={onClick}
      colorScheme="secondary"
    />
  )
}

export const MenuBar = () => {
  const { editor } = useCurrentEditor()
  if (!editor) {
    return null
  }

  return (
    <ButtonGroup
      isFullWidth={false}
      width="full"
      backgroundColor="neutral.100"
      borderBottom="1px solid"
      borderColor="neutral.400"
    >
      <IconButton
        ariaLabel="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        icon={<BxsBold />}
      />
      <IconButton
        ariaLabel="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        icon={<BxsItalic />}
      />
      <IconButton
        ariaLabel="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        icon={<BxsStrikethrough />}
      />
      <IconButton
        ariaLabel="Unordered List"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={!editor.can().chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        icon={<BxsUnorderedList />}
      />
      <IconButton
        ariaLabel="Ordered List"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={!editor.can().chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        icon={<BxsOrderedList />}
      />
    </ButtonGroup>
  )
}

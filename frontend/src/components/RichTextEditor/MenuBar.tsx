import { useCurrentEditor } from '@tiptap/react'

import { BxsBold } from '~assets/icons/BxsBold'
import { BxsItalic } from '~assets/icons/BxsItalic'
import { BxsLink } from '~assets/icons/BxsLink'
import { BxsOrderedList } from '~assets/icons/BxsOrderedList'
import { BxsStrikethrough } from '~assets/icons/BxsStrikethrough'
import { BxsUnorderedList } from '~assets/icons/BxsUnorderedList'
import ButtonGroup from '~components/ButtonGroup'
import IconButton from '~components/IconButton'

export const MenuBar = () => {
  const { editor } = useCurrentEditor()
  if (!editor) {
    return null
  }

  const handleLinkClick = () => {
    console.log('Link clicked!')
  }

  return (
    <ButtonGroup
      isFullWidth={false}
      width="full"
      backgroundColor="neutral.100"
      borderBottom="1px solid"
      borderColor="neutral.400"
      variant="clear"
      colorScheme="secondary"
    >
      <IconButton
        aria-label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        icon={<BxsBold />}
      />
      <IconButton
        aria-label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        icon={<BxsItalic />}
      />
      <IconButton
        aria-label="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        icon={<BxsStrikethrough />}
      />
      <IconButton
        aria-label="Link"
        onClick={handleLinkClick}
        disabled={editor.state.selection.empty && !editor.isActive('link')}
        isActive={editor.isActive('link')}
        icon={<BxsLink />}
      />
      <IconButton
        aria-label="Unordered List"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={!editor.can().chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        icon={<BxsUnorderedList />}
      />
      <IconButton
        aria-label="Ordered List"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={!editor.can().chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        icon={<BxsOrderedList />}
      />
    </ButtonGroup>
  )
}

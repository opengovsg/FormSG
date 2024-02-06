import React from 'react'
import { useCurrentEditor } from '@tiptap/react'

import ButtonComponent from '../Button'

const Button = ({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactChild
  onClick: () => void
  disabled: boolean
  active?: boolean
}): JSX.Element => {
  return (
    <ButtonComponent
      variant="outline"
      onClick={onClick}
      isDisabled={disabled}
      isActive={active}
    >
      {children}
    </ButtonComponent>
  )
}

export const MenuBar = () => {
  const { editor } = useCurrentEditor()
  if (!editor) {
    return null
  }

  return (
    <>
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
      >
        Bold
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
      >
        Italic
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
      >
        Strikethrough
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        disabled={
          !editor.can().chain().focus().toggleHeading({ level: 1 }).run()
        }
        active={editor.isActive('heading', { level: 1 })}
      >
        H1
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={!editor.can().chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
      >
        ul
      </Button>
      <Button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
      >
        ol
      </Button>
      <Button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        undo
      </Button>
      <Button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        redo
      </Button>
    </>
  )
}

import { RefObject, useEffect, useState } from 'react'
import { Flex } from '@chakra-ui/react'
import { BubbleMenu, Editor, getMarkRange, getMarkType } from '@tiptap/react'
import { Props } from 'tippy.js'

import { BxCheck, BxsEditAlt } from '~assets/icons'
import { BxsTrashAlt } from '~assets/icons/BxsTrashAlt'
import ButtonGroup from '~components/ButtonGroup'
import IconButton from '~components/IconButton'
import Input from '~components/Input'
import Link from '~components/Link'

type LinkBubbleMenuProps = {
  editor: Editor | null
  containerRef: RefObject<HTMLDivElement>
}

export const LinkBubbleMenu = ({
  editor,
  containerRef,
}: LinkBubbleMenuProps): JSX.Element | null => {
  const [link, setLink] = useState<string>(editor?.getAttributes('link').href)
  const [isEditable, setisEditable] = useState<boolean>(false)

  useEffect(() => {
    setLink(editor?.getAttributes('link').href)
  }, [editor, editor?.state.selection])

  if (!editor) return null

  // Update link href then set editor selection to end of the link text.
  const handleUpdateLinkClick = () => {
    editor
      .chain()
      .extendMarkRange('link')
      .updateAttributes('link', { href: link })
      .run()

    // Run the commands separately so that editor selection is updated
    editor
      .chain()
      .setTextSelection(editor.state.selection.$to.pos)
      .focus()
      .run()
  }

  const tippyOptions: Partial<Props> = {
    placement: 'bottom',
    maxWidth: 'none',
    onHidden: () => setisEditable(false),
    // Create a fixed position for the bubble menu, else it follows the cursor
    getReferenceClientRect: (): DOMRect => {
      const startPos = getMarkRange(
        editor.state.selection.$anchor,
        getMarkType('link', editor.schema),
      )?.from
      if (startPos == null) return new DOMRect()
      const { left, bottom } = editor.view.coordsAtPos(startPos)
      return new DOMRect(left, bottom)
    },
    popperOptions: {
      modifiers: [
        {
          // Specify the container for the bubble menu to fix clipping issues.
          name: 'preventOverflow',
          options: {
            // TODO: Check if this cast is safe
            boundary: containerRef.current as Element,
          },
        },
      ],
    },
  }

  return (
    <BubbleMenu
      editor={editor}
      className="tiptap-link-bubble-menu"
      shouldShow={({ editor }) => editor.isActive('link')}
      tippyOptions={tippyOptions}
    >
      <Flex
        align="center"
        backgroundColor="white"
        borderRadius="0 0 8px 8px"
        boxShadow="gray 0 1px 8px"
        justify="space-between"
        padding="1"
        width="xs"
      >
        {isEditable ? (
          <Input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            padding={0}
            border="none"
            flexBasis="200px"
            flexShrink={1}
            flexGrow={1}
          />
        ) : (
          <Link
            href={link}
            target="_blank"
            rel="noreferrer"
            colorScheme="blue"
            flexBasis="200px"
            flexShrink={1}
            flexGrow={1}
            minWidth={0}
          >
            <p style={{ minWidth: 0 }}>{link}</p>
          </Link>
        )}
        <ButtonGroup
          isFullWidth={false}
          variant="clear"
          colorScheme="secondary"
        >
          <IconButton
            aria-label="Edit Link"
            onClick={() => setisEditable(!isEditable)}
            isActive={isEditable}
            icon={<BxsEditAlt />}
          />
          {isEditable ? (
            <IconButton
              aria-label="Update Link"
              onClick={handleUpdateLinkClick}
              icon={<BxCheck />}
            />
          ) : (
            <IconButton
              aria-label="Delete Link"
              onClick={() => editor.chain().focus().unsetLink().run()}
              icon={<BxsTrashAlt />}
            />
          )}
        </ButtonGroup>
      </Flex>
    </BubbleMenu>
  )
}

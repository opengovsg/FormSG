import React, { RefObject, useEffect, useState } from 'react'
import { Divider, Flex } from '@chakra-ui/react'
import { BubbleMenu, Editor, getMarkRange, getMarkType } from '@tiptap/react'
import { Props } from 'tippy.js'

import { BxCheck, BxsEditAlt } from '~assets/icons'
import { BxsTrash } from '~assets/icons/BxsTrash'
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
  const [isEditable, setisEditable] = useState<boolean>(true)

  useEffect(() => {
    setLink(editor?.getAttributes('link').href)
  }, [editor, editor?.state.selection])

  if (!editor) return null

  // Update link href then set editor selection to end of the link text.
  const handleUpdateLinkClick = () => {
    let updateLink = link
    if (updateLink === '') {
      editor.chain().unsetLink().run()
      return
    }

    if (!link.startsWith('http')) {
      updateLink = 'https://' + updateLink
    }

    editor
      .chain()
      .extendMarkRange('link')
      .updateAttributes('link', { href: updateLink })
      .run()

    // Run the commands separately so that editor selection is updated
    editor
      .chain()
      .setTextSelection(editor.state.selection.$to.pos)
      .focus()
      .run()

    setisEditable(false)
  }

  const handleEditLinkKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUpdateLinkClick()
    }
  }

  const popoverPadding = 4
  const borderPadding = 4

  const tippyOptions: Partial<Props> = {
    placement: 'bottom-start',
    maxWidth: 'none',
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
            boundary: containerRef?.current,
            padding: popoverPadding + borderPadding,
            flip: false,
          },
        },
        {
          // Prevent bubble menu from flipping position when link is too far right
          name: 'flip',
          options: {
            fallbackPlacements: [],
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
        border="1px solid"
        borderColor="neutral.400"
        borderRadius="base"
        boxShadow="0px 0px 10px 0px #D8DEEB80"
        // Gives 16px gap from button to end of input
        gap="4px"
        height="auto"
        justify="space-between"
        minHeight="50px"
        padding={4 + 'px'}
      >
        {isEditable ? (
          <Input
            flexBasis="200px"
            flexGrow={1}
            flexShrink={1}
            onChange={(e) => setLink(e.target.value)}
            onKeyPress={handleEditLinkKeyPress}
            padding={0}
            placeholder="https://form.gov.sg"
            type="text"
            value={link}
            // Override default border styles
            sx={{
              border: 'none',
            }}
            _focus={{
              border: 'none',
            }}
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
          alignItems="center"
          colorScheme="secondary"
          isFullWidth={false}
          variant="clear"
        >
          {isEditable ? (
            <IconButton
              aria-label="Update Link"
              icon={<BxCheck />}
              onClick={handleUpdateLinkClick}
            />
          ) : (
            <IconButton
              aria-label="Edit Link"
              icon={<BxsEditAlt />}
              onClick={() => setisEditable(!isEditable)}
            />
          )}
          <Divider orientation="vertical" height="1.5rem" />
          <IconButton
            aria-label="Delete Link"
            icon={<BxsTrash />}
            onClick={() => editor.chain().focus().unsetLink().run()}
          />
        </ButtonGroup>
      </Flex>
    </BubbleMenu>
  )
}

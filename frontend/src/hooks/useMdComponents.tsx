import { useMemo } from 'react'
import { Components } from 'react-markdown'
import {
  ListItem,
  OrderedList,
  SystemStyleObject,
  Text,
  UnorderedList,
} from '@chakra-ui/react'

import Link from '~components/Link'

type MdComponentStyles = {
  /**
   * If exists, will be used for styling links
   */
  link?: SystemStyleObject
  /**
   * If exists, will be used for styling text
   */
  text?: SystemStyleObject
  /**
   * If exists, will be used for styling lists
   */
  list?: SystemStyleObject
  /**
   * If exists, will be used for styling ordered lists
   */
  listItem?: SystemStyleObject
}

type UseMdComponentsProps = {
  styles?: MdComponentStyles
  overrides?: Components
}

export const useMdComponents = ({
  styles = {},
  overrides = {},
}: UseMdComponentsProps = {}): Components => {
  const textStyles = useMemo(
    () => ({
      sx: {
        whiteSpace: 'pre-wrap',
        ...(styles.text ?? {}),
      },
    }),
    [styles.text],
  )

  const linkStyles = useMemo(
    () => ({
      sx: {
        whiteSpace: 'pre-wrap',
        display: 'initial',
        ...(styles.link ?? {}),
      },
    }),
    [styles.link],
  )

  const listItemStyle = useMemo(
    () => ({
      sx: {
        ...(styles.listItem ?? {}),
      },
    }),
    [styles.listItem],
  )

  const listStyles = useMemo(
    () => ({
      sx: {
        whiteSpace: 'pre-wrap',
        ...(styles.list ?? {}),
      },
    }),
    [styles.list],
  )

  const mdComponents: Components = useMemo(
    () => ({
      ol: ({ node, ...props }) => (
        <OrderedList
          marginInlineStart="1.25rem"
          whiteSpace="initial"
          {...props}
          {...textStyles}
        />
      ),
      ul: ({ node, ...props }) => <UnorderedList {...props} {...listStyles} />,
      li: ({ node, ...props }) => (
        <ListItem {...props} {...textStyles} {...listItemStyle} />
      ),
      a: ({ node, ...props }) => {
        const { href } = props
        const isExternal =
          (href && !href.startsWith(window.location.origin)) || false

        return <Link {...props} isExternal={isExternal} {...linkStyles} />
      },
      p: ({ node, ...props }) => <Text {...props} {...textStyles} />,
      ...overrides,
    }),
    [linkStyles, overrides, textStyles, listStyles, listItemStyle],
  )

  return mdComponents
}

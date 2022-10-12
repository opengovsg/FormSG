import { useMemo } from 'react'
import { Components } from 'react-markdown'
import {
  CSSObject,
  ListItem,
  OrderedList,
  Text,
  UnorderedList,
} from '@chakra-ui/react'

import Link from '~components/Link'

type MdComponentStyles = {
  /**
   * If exists, will be used for styling links
   */
  link?: CSSObject
  /**
   * If exists, will be used for styling text
   */
  text?: CSSObject
  /**
   * If exists, will be used for styling text
   */
  list?: CSSObject
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
        ...(styles.link ?? {}),
      },
    }),
    [styles.link],
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
      ol: ({ node, ordered, ...props }) => (
        <OrderedList
          marginInlineStart="1.25rem"
          whiteSpace="initial"
          {...props}
          {...textStyles}
        />
      ),
      ul: ({ node, ordered, ...props }) => (
        <UnorderedList {...props} {...listStyles} />
      ),
      li: ({ node, ordered, ...props }) => (
        <ListItem {...props} {...textStyles} />
      ),
      a: ({ node, ...props }) => {
        const { href } = props
        const isExternal =
          typeof href === 'string' && !href.startsWith(window.location.origin)

        return <Link {...props} isExternal={isExternal} {...linkStyles} />
      },
      p: ({ node, ...props }) => <Text {...props} {...textStyles} />,
      ...overrides,
    }),
    [linkStyles, overrides, textStyles, listStyles],
  )

  return mdComponents
}

import { useMemo } from 'react'
import { Components } from 'react-markdown'
import { CSSObject, ListItem, OrderedList, Text } from '@chakra-ui/react'

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
    () => ({ ...(styles?.text ? { sx: styles.text } : {}) }),
    [styles.text],
  )

  const linkStyles = useMemo(
    () => ({ ...(styles.link ? { sx: styles.link } : {}) }),
    [styles.link],
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
      li: ({ node, ...props }) => <ListItem {...props} {...textStyles} />,
      a: ({ node, ...props }) => {
        const { href } = props
        const isExternal =
          typeof href === 'string' && !href.startsWith(window.location.origin)

        return <Link {...props} isExternal={isExternal} {...linkStyles} />
      },
      p: ({ node, ...props }) => <Text {...props} {...textStyles} />,
      ...overrides,
    }),
    [linkStyles, overrides, textStyles],
  )

  return mdComponents
}

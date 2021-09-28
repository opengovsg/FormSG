import { useMemo } from 'react'
import { Components } from 'react-markdown/src/ast-to-react'
import { CSSObject, Text } from '@chakra-ui/react'

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
  const mdComponents: Components = useMemo(
    () => ({
      a: (props) => {
        const { href } = props
        const isExternal =
          typeof href === 'string' && !href.startsWith(window.location.origin)

        return (
          <Link
            {...props}
            isExternal={isExternal}
            {...(styles.link ? { sx: styles.link } : {})}
          />
        )
      },
      p: (props) => (
        <Text {...props} {...(styles?.text ? { sx: styles.text } : {})} />
      ),
      ...overrides,
    }),
    [overrides, styles],
  )

  return mdComponents
}

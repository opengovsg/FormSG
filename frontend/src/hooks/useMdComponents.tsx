import { useMemo } from 'react'
import { Components } from 'react-markdown/src/ast-to-react'
import { CSSObject } from '@chakra-ui/react'

import Link from '~components/Link'

type MdComponentStyles = {
  /**
   * If exists, will be used for styling links
   */
  link?: CSSObject
}

export const useMdComponents = (styles: MdComponentStyles): Components => {
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
    }),
    [styles.link],
  )

  return mdComponents
}

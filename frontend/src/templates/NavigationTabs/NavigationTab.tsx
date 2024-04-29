import { PropsWithChildren } from 'react'
import { Link as ReactLink, LinkProps } from 'react-router-dom'
import { chakra } from '@chakra-ui/react'

import { useNavigationTabStyles } from './NavigationTabContext'

const Link = chakra(ReactLink)

interface NavigationTabProps extends LinkProps {
  isActive?: boolean
  isDisabled?: boolean
}

/** Must be nested inside NavigationTabList component, uses styles provided by that component. */
export const NavigationTab = ({
  isActive,
  isDisabled,
  children,
  ...props
}: PropsWithChildren<NavigationTabProps>) => {
  const styles = useNavigationTabStyles()

  if (isDisabled) {
    return (
      <chakra.a
        __css={styles.tab}
        aria-disabled
        display="inline-flex"
        alignItems="center"
      >
        {children}
      </chakra.a>
    )
  }

  return (
    <Link aria-selected={isActive} __css={styles.tab} {...props}>
      {children}
    </Link>
  )
}

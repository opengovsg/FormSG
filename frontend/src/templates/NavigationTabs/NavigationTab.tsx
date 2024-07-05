import { ComponentProps } from 'react'
import { Link as ReactLink } from 'react-router-dom'
import { chakra, useStyles } from '@chakra-ui/react'

const Link = chakra(ReactLink)

interface NavigationTabProps extends ComponentProps<typeof Link> {
  isActive?: boolean
  isDisabled?: boolean
  showReddot?: boolean
}

/** Must be nested inside NavigationTabList component, uses styles provided by that component. */
export const NavigationTab = ({
  isActive,
  isDisabled,
  children,
  ...props
}: NavigationTabProps) => {
  const styles = useStyles()

  if (isDisabled) {
    return (
      <chakra.a
        __css={styles.tab}
        aria-disabled
        d="inline-flex"
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

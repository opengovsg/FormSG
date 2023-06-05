import { Navigate, useLocation } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { useAuth } from '~contexts/AuthContext'
import { DASHBOARD_ROUTE } from '~constants/routes'
import { fillHeightCss } from '~utils/fillHeightCss'
import GovtMasthead from '~components/GovtMasthead'

interface PublicElementProps {
  /**
   * If `strict` is true, only non-authed users can access the route.
   * i.e. signin page, where authed users accessing that page should be
   * redirected out.
   * If `strict` is false, then both authed and non-authed users can access
   * the route.
   * Defaults to `false`.
   */
  strict?: boolean
  element: React.ReactElement
}

export const PublicElement = ({
  element,
  strict,
}: PublicElementProps): React.ReactElement => {
  const location = useLocation()
  const state = location.state as { from: Location } | undefined

  const { isAuthenticated } = useAuth()

  if (isAuthenticated && strict) {
    return <Navigate to={state?.from.pathname ?? DASHBOARD_ROUTE} replace />
  }

  return (
    <Flex flexDir="column" css={fillHeightCss} pos="relative">
      <GovtMasthead />
      {element}
    </Flex>
  )
}

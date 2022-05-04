import { Navigate, NavigateProps, useLocation } from 'react-router-dom'

import { useAuth } from '~contexts/AuthContext'
import { LOGIN_ROUTE } from '~constants/routes'

interface HashRouterElementProps {
  /**
   * Route to redirect to when user is not authenticated. Defaults to
   * `LOGIN_ROUTE` if not provided.
   */
  redirectTo?: NavigateProps['to']
  element: React.ReactElement
}

const hashRouteMapper = [
  {
    regex: /^#!\/(?<formid>[0-9a-fA-F]{24})$/,
    getTarget: (m: RegExpMatchArray) => `/${m.groups.formid}`,
  },
  {
    regex: /^#!\/(?<formid>[0-9a-fA-F]{24})\/admin$/,
    getTarget: (m: RegExpMatchArray) => `/admin/${m.groups.formid}`,
  },
  {
    regex: /^#!\/(?<formid>[0-9a-fA-F]{24})\/preview$/,
    getTarget: (m: RegExpMatchArray) => `/admin/${m.groups.formid}/preview`,
  },
  {
    regex: /^#!\/examples$/,
    getTarget: (m: RegExpMatchArray) => `/admin`,
  },
]

export const HashRouterElement = ({
  element,
  redirectTo = LOGIN_ROUTE,
}: HashRouterElementProps): React.ReactElement => {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  // Retire this custom routing after July 2024
  if (location.hash.startsWith('#!/')) {
    // angular routes that need to be mapped
    for (const { regex, getTarget } of hashRouteMapper) {
      const match = location.hash.match(regex)
      if (match) {
        redirectTo = getTarget(match)
        return <Navigate replace to={redirectTo} state={{ from: location }} />
      }
    }
  }

  return isAuthenticated ? (
    element
  ) : (
    <Navigate replace to={redirectTo} state={{ from: location }} />
  )
}

import { Navigate, NavigateProps, useLocation } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { useAuth } from '~contexts/AuthContext'
import { LOGIN_ROUTE } from '~constants/routes'
import GovtMasthead from '~components/GovtMasthead'

import { PreviewFormHeader } from '~features/admin-form/common/components/PreviewFormHeader/PreviewFormHeader'

interface PrivateElementProps {
  /**
   * Route to redirect to when user is not authenticated. Defaults to
   * `LOGIN_ROUTE` if not provided.
   *
   * If `isPreview` is true, Govt Masthead will appear.
   * Defaults to `false`.
   */
  redirectTo?: NavigateProps['to']
  element: React.ReactElement
  isPreview?: boolean
}

export const PrivateElement = ({
  element,
  redirectTo = LOGIN_ROUTE,
  isPreview,
}: PrivateElementProps): React.ReactElement => {
  const location = useLocation()

  const { isAuthenticated } = useAuth()

  return isAuthenticated ? (
    isPreview ? (
      <Flex flexDir="column" height="100vh" pos="relative">
        <GovtMasthead />
        <PreviewFormHeader />
        {element}
      </Flex>
    ) : (
      element
    )
  ) : (
    <Navigate replace to={redirectTo} state={{ from: location }} />
  )
}

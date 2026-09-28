import { Outlet } from 'react-router-dom'

import { useIsDelightfulDashboard } from '../hooks'

import { ResponsesTabWrapper } from './common/ResponsesTabWrapper'
import { UnlockedResponsesProvider } from './storage/UnlockedResponses'

/**
 * Page for rendering subroutes via `Outlet` component for admin form result responses pages.
 */
export const ResponsesLayout = (): JSX.Element => {
  const isDelightfulDashboard = useIsDelightfulDashboard()

  const responses = (
    <UnlockedResponsesProvider>
      <Outlet />
    </UnlockedResponsesProvider>
  )

  return isDelightfulDashboard ? (
    responses
  ) : (
    <ResponsesTabWrapper>{responses}</ResponsesTabWrapper>
  )
}

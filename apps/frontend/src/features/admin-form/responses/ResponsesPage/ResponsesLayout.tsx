import { Outlet } from 'react-router-dom'

import { useIsDelightfulDashboard } from '../hooks'

import { ResponsesTabWrapper } from './common/ResponsesTabWrapper'
import { UnlockedResponsesProvider } from './storage/UnlockedResponses'
import { ResponsesPage } from './ResponsesPage'

/**
 * Page for rendering subroutes via `Outlet` component for admin form result responses pages.
 */
export const ResponsesLayout = ({
  showResponses = false,
}: {
  showResponses?: boolean
} = {}): JSX.Element => {
  const isDelightfulDashboard = useIsDelightfulDashboard()

  if (!isDelightfulDashboard) {
    return (
      <ResponsesTabWrapper>
        <UnlockedResponsesProvider>
          <Outlet />
        </UnlockedResponsesProvider>
      </ResponsesTabWrapper>
    )
  }

  return (
    <UnlockedResponsesProvider>
      {showResponses ? <ResponsesPage /> : null}
      <Outlet />
    </UnlockedResponsesProvider>
  )
}

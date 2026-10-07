import { Outlet } from 'react-router-dom'

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
  return (
    <UnlockedResponsesProvider>
      {showResponses ? <ResponsesPage /> : null}
      <Outlet />
    </UnlockedResponsesProvider>
  )
}

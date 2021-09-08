import { useCallback } from 'react'
import { useHistory } from 'react-router-dom'

import { ROOT_ROUTE } from '~constants/routes'

import { useAdminForm } from '../../queries'

import { AdminFormNavbar } from './AdminFormNavbar'

/**
 * @precondition Must have AdminFormTabProvider parent due to usage of TabList and Tab.
 */
export const AdminFormNavbarContainer = (): JSX.Element => {
  const { data: form } = useAdminForm()

  const history = useHistory()

  const handleBackToDashboard = useCallback((): void => {
    history.push(ROOT_ROUTE)
  }, [history])

  const handleAddCollaborator = useCallback((): void => {
    console.log('add collab button clicked')
  }, [])

  const handlePreviewForm = useCallback((): void => {
    console.log('preview form button clicked')
  }, [])

  const handleShareForm = useCallback((): void => {
    console.log('share form button clicked')
  }, [])

  return (
    <AdminFormNavbar
      formInfo={form}
      handleBackButtonClick={handleBackToDashboard}
      handleAddCollabButtonClick={handleAddCollaborator}
      handlePreviewFormButtonClick={handlePreviewForm}
      handleShareButtonClick={handleShareForm}
    />
  )
}

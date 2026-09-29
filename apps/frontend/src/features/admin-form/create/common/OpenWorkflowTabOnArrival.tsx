import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAdminWorkflowStore } from '../workflow/adminWorkflowStore'

import { useCreatePageSidebar } from './CreatePageSidebarContext'

export const OPEN_WORKFLOW_TAB_STATE = { openWorkflowTab: true } as const

type OpenWorkflowTabState = typeof OPEN_WORKFLOW_TAB_STATE & {
  /** 0-based step to open in edit mode once the tab is open. */
  editStep?: number
}

/** Router state that opens the Workflow tab, optionally editing a step. */
export const getOpenWorkflowTabState = (
  editStep?: number,
): OpenWorkflowTabState => ({ ...OPEN_WORKFLOW_TAB_STATE, editStep })

export const OpenWorkflowTabOnArrival = (): null => {
  const { state, pathname } = useLocation()
  const navigate = useNavigate()
  const { handleWorkflowClick } = useCreatePageSidebar()
  const hasOpened = useRef(false)

  useEffect(() => {
    if (hasOpened.current) return
    const arrivalState = state as OpenWorkflowTabState | null
    if (!arrivalState?.openWorkflowTab) {
      return
    }

    hasOpened.current = true
    handleWorkflowClick(false)
    if (arrivalState.editStep !== undefined) {
      useAdminWorkflowStore.getState().setToEditing(arrivalState.editStep)
    }

    navigate(pathname, { replace: true, state: null })
  }, [handleWorkflowClick, navigate, pathname, state])

  return null
}

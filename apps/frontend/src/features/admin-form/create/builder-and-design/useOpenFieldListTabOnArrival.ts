import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useCreatePageSidebar } from '../common/CreatePageSidebarContext'

import { FieldListTabIndex } from './constants'

type OpenFieldListTabState = { openFieldListTab: FieldListTabIndex }

/** Router state that opens the field list on this tab, e.g. from Settings. */
export const openFieldListTabState = (
  tab: FieldListTabIndex,
): OpenFieldListTabState => ({ openFieldListTab: tab })

const getArrivalTab = (state: unknown): FieldListTabIndex | undefined =>
  (state as OpenFieldListTabState | null)?.openFieldListTab

export const useOpenFieldListTabOnArrival = () => {
  const { pathname, search, hash, state } = useLocation()
  const navigate = useNavigate()
  const { handleBuilderClick, setFieldListTabIndex } = useCreatePageSidebar()
  const tab = getArrivalTab(state)

  useEffect(() => {
    if (tab === undefined) return
    setFieldListTabIndex(tab)
    handleBuilderClick(false)
    // Open the tab only once, even after a refresh.
    navigate({ pathname, search, hash }, { replace: true, state: null })
  }, [
    tab,
    setFieldListTabIndex,
    handleBuilderClick,
    navigate,
    pathname,
    search,
    hash,
  ])
}

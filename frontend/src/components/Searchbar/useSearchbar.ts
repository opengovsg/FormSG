/**
 * Hook exposing convenient variables for use with `Searchbar` component.
 */

import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

type UseSearchbarReturn = {
  inputRef: RefObject<HTMLInputElement>
  isExpanded: boolean
  handleExpansion: () => void
  handleCollapse: () => void
}

export const useSearchbar = ({
  isInitiallyExpanded = false,
  isFocusOnExpand = true,
}: {
  /**
   * If `true`, the searchbar will be expanded on initial render.
   */
  isInitiallyExpanded?: boolean
  /**
   * If `true`, the searchbar will be focused whenever the searchbar is expanded.
   * Defaults to `true`.
   */
  isFocusOnExpand?: boolean
}): UseSearchbarReturn => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isFocusOnExpand && isExpanded) {
      inputRef.current?.focus()
    }
  }, [isExpanded, isFocusOnExpand])

  const handleExpansion = useCallback(() => setIsExpanded(true), [])
  const handleCollapse = useCallback(() => setIsExpanded(false), [])

  return {
    inputRef,
    isExpanded,
    handleExpansion,
    handleCollapse,
  }
}

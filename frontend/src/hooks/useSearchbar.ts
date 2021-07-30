/**
 * Hook exposing convenient variables for use with `Searchbar` component.
 */

import {
  RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

type UseSearchbarReturn = {
  inputRef: RefObject<HTMLInputElement>
  isExpanded: boolean
  handleExpansion: () => void
  handleCollapse: () => void
}

export const useSearchbar = ({
  isInitiallyExpanded = false,
  isFocusOnExpand = false,
}: {
  /**
   * If `true`, the searchbar will be expanded on initial render.
   */
  isInitiallyExpanded?: boolean
  /**
   * If `true`, the searchbar will be focused whenever the searchbar is expanded.
   */
  isFocusOnExpand?: boolean
}): UseSearchbarReturn => {
  const [isExpanded, onExpansionChange] = useState(isInitiallyExpanded)
  const inputRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    if (isFocusOnExpand && isExpanded) {
      inputRef.current?.focus()
    }
  }, [isExpanded, isFocusOnExpand])

  const handleExpansion = useCallback(() => onExpansionChange(true), [])
  const handleCollapse = useCallback(() => onExpansionChange(false), [])

  return {
    inputRef,
    isExpanded,
    handleExpansion,
    handleCollapse,
  }
}

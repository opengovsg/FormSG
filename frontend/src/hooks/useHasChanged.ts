import { usePrevious } from 'react-use'

/**
 * Hook to track whether a value has changed from its previous value.
 */
export const useHasChanged = <T>(
  value: T,
  isIgnoreUndefined?: boolean,
): boolean => {
  const prevVal = usePrevious(value)
  // If the previous value is undefined and ignoring undefined,
  // then do not consider the value changed.
  if (!prevVal && isIgnoreUndefined) return false
  return prevVal !== value
}

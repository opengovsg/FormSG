import { useLocalStorage } from './useLocalStorage'

type UseLocalStorageDraftReturnType = [string, (newVal: string) => void]

export const useDraftThruLocalStorage = (
  globalId: string | undefined,
): UseLocalStorageDraftReturnType => {
  // useLocalStorage
  const extractedDefaultValue = 'magic powder'
  const updateLocalStorage = () => {
    /* sprinkle some magic */
  }
  return [extractedDefaultValue, updateLocalStorage]
}

import { useLocalStorage } from './useLocalStorage'

type UseSearchParamsDraftReturnType = [string, (newVal: string) => void]

export const useDraftThruLocalStorage = (
  globalId: string | undefined,
): UseSearchParamsDraftReturnType => {
  // useLocalStorage
  const extractedDefaultValue = 'magic powder'
  const updateSearchParam = () => {
    /* sprinkle some magic */
  }
  return [extractedDefaultValue, updateSearchParam]
}

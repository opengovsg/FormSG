import { useSearchParams } from 'react-router-dom'

type UseSearchParamsDraftReturnType = [string, (newVal: string) => void]

export const useDraftThruSearchParams = (
  globalId: string | undefined,
): UseSearchParamsDraftReturnType => {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = new URLSearchParams(searchParams)

  const extractedDefaultValue = (globalId ? params.get(globalId) : '') ?? ''

  const updateSearchParam = (val: string) => {
    if (globalId) params.set(globalId, val)
    setSearchParams(params)
  }

  return [extractedDefaultValue, updateSearchParam]
}

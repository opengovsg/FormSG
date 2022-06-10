import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const PAGE_KEY = 'page'

export const usePageSearchParams = () => {
  const [params, setParams] = useSearchParams()
  const currentPage = useMemo(() => {
    const value = params.get(PAGE_KEY)
    if (!value) return
    if (Number(value) < 1) return 1
    return Number(value)
  }, [params])

  const setCurrentPage = useCallback(
    (page: number) => {
      if (page < 0) {
        page = 1
      }
      setParams({
        [PAGE_KEY]: String(page),
      })
    },
    [setParams],
  )

  return [currentPage, setCurrentPage] as const
}

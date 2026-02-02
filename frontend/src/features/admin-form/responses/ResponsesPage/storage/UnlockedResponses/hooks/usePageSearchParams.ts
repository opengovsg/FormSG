import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const PAGE_KEY = 'page'
const SUBMISSION_ID_KEY = 'submissionId'
const FILTERS_KEY = 'filters'

interface Filter {
  fieldId: string
  operator: string
  value: string
}

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
      params.set(PAGE_KEY, page.toString())
      setParams(params)
    },
    [params, setParams],
  )

  const submissionId = useMemo(() => {
    const value = params.get(SUBMISSION_ID_KEY)
    if (!value) return
    return value
  }, [params])

  const setSubmissionId = useCallback(
    (submissionId: string | null) => {
      if (!submissionId) {
        params.delete(SUBMISSION_ID_KEY)
        setParams(params)
      } else {
        // Not using params.set due to wanting to remove other params if they exist.
        setParams({
          [SUBMISSION_ID_KEY]: submissionId,
        })
      }
    },
    [params, setParams],
  )

  // Parse filters from URL
  const urlFilters = useMemo((): Filter[] => {
    const value = params.get(FILTERS_KEY)
    if (!value) return []
    try {
      const parsed = JSON.parse(decodeURIComponent(value))
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (f) =>
            typeof f.fieldId === 'string' &&
            typeof f.operator === 'string' &&
            typeof f.value === 'string',
        )
      }
      return []
    } catch {
      return []
    }
  }, [params])

  // Sync filters to URL
  const setUrlFilters = useCallback(
    (filters: Filter[]) => {
      if (filters.length === 0) {
        params.delete(FILTERS_KEY)
      } else {
        params.set(FILTERS_KEY, encodeURIComponent(JSON.stringify(filters)))
      }
      setParams(params, { replace: true })
    },
    [params, setParams],
  )

  return {
    submissionId: [submissionId, setSubmissionId],
    page: [currentPage, setCurrentPage],
    filters: [urlFilters, setUrlFilters],
  } as const
}

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const PAGE_KEY = 'page'
const SUBMISSION_ID_KEY = 'submissionId'

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

  return {
    submissionId: [submissionId, setSubmissionId],
    page: [currentPage, setCurrentPage],
  } as const
}

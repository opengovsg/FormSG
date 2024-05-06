import { useEffect, useState } from 'react'
import { Searchbar, useSearchbar } from '@opengovsg/design-system-react'

export const SubmissionSearchbar = ({
  submissionId,
  setSubmissionId,
  isAnyFetching,
}: {
  submissionId?: string
  setSubmissionId: (submissionId: string | null) => void
  isAnyFetching: boolean
}): JSX.Element => {
  const [inputValue, setInputValue] = useState(submissionId)

  useEffect(() => {
    // Sync input value with submissionId.
    setInputValue(submissionId ?? '')
  }, [submissionId])

  const { inputRef } = useSearchbar({})

  return (
    <Searchbar
      isDisabled={isAnyFetching}
      ref={inputRef}
      value={inputValue}
      isExpanded={!!submissionId}
      onChange={(e) => setInputValue(e.target.value)}
      onExpansion={(isExpanded) => {
        if (!isExpanded) {
          setSubmissionId(null)
        }
      }}
      onSearch={setSubmissionId}
      placeholder="Search by response ID"
    />
  )
}

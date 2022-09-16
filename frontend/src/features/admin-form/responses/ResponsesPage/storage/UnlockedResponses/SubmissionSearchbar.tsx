import { useEffect, useState } from 'react'

import Searchbar, { useSearchbar } from '~components/Searchbar'

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

  const { inputRef } = useSearchbar()

  return (
    <Searchbar
      isDisabled={isAnyFetching}
      ref={inputRef}
      value={inputValue}
      isExpanded={!!submissionId}
      onChange={setInputValue}
      onCollapseIconClick={() => setSubmissionId(null)}
      onSearch={setSubmissionId}
      placeholder="Search by response ID"
    />
  )
}

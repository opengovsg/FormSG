import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Searchbar, { useSearchbar } from '~components/Searchbar'

export const SubmissionSearchbar = ({
  submissionId,
  setSubmissionId,
  isAnyFetching,
  isExpandable = true,
}: {
  submissionId?: string
  setSubmissionId: (submissionId: string | null) => void
  isAnyFetching: boolean
  isExpandable?: boolean
}): JSX.Element => {
  const [inputValue, setInputValue] = useState(submissionId)

  useEffect(() => {
    // Sync input value with submissionId.
    setInputValue(submissionId ?? '')
  }, [submissionId])

  const { inputRef } = useSearchbar()

  const { t } = useTranslation()

  return (
    <Searchbar
      isExpandable={isExpandable}
      isDisabled={isAnyFetching}
      ref={inputRef}
      value={inputValue}
      isExpanded={!!submissionId}
      onChange={setInputValue}
      onCollapseIconClick={() => setSubmissionId(null)}
      onSearch={setSubmissionId}
      placeholder={t(
        isExpandable
          ? 'features.adminForm.responses.responsesPage.storage.unlockedResponses.submissionSearchbarPlaceholder'
          : 'features.adminForm.responses.responsesPage.storage.unlockedResponses.searchResponsesPlaceholder',
      )}
    />
  )
}

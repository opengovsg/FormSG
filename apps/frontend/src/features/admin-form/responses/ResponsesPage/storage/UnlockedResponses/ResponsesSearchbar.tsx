import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from 'react-use'

import Searchbar, { useSearchbar } from '~components/Searchbar'

import { useUnlockedResponses } from './UnlockedResponsesProvider'

const SEARCH_DEBOUNCE_MS = 200

export const ResponsesSearchbar = (): JSX.Element => {
  const { t } = useTranslation()
  const { searchText, setSearchText } = useUnlockedResponses()
  const [inputValue, setInputValue] = useState(searchText)
  const { inputRef } = useSearchbar()

  useEffect(() => {
    setInputValue(searchText)
  }, [searchText])

  useDebounce(() => setSearchText(inputValue), SEARCH_DEBOUNCE_MS, [inputValue])

  return (
    <Searchbar
      isExpandable={false}
      ref={inputRef}
      value={inputValue}
      onChange={setInputValue}
      onSearch={setSearchText}
      placeholder={t(
        'features.adminForm.responses.responsesPage.storage.unlockedResponses.searchResponsesPlaceholder',
      )}
    />
  )
}

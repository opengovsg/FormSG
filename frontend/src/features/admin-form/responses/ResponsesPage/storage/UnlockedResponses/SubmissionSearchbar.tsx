import { useState } from 'react'
import { BiX } from 'react-icons/bi'
import { InputRightElement } from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Searchbar, { useSearchbar } from '~components/Searchbar'

import { useUnlockedResponses } from './UnlockedResponsesProvider'

export const SubmissionSearchbar = (): JSX.Element => {
  const { submissionId, setSubmissionId, isAnyFetching } =
    useUnlockedResponses()

  const [inputValue, setInputValue] = useState(submissionId)

  const { isExpanded, inputRef, handleExpansion, handleCollapse } =
    useSearchbar({
      isInitiallyExpanded: !!submissionId,
    })

  return (
    <Searchbar
      isDisabled={isAnyFetching}
      ref={inputRef}
      value={inputValue}
      onChange={(nextValue) => setInputValue(nextValue)}
      onSearchIconClick={handleExpansion}
      isExpanded={isExpanded}
      onSearch={setSubmissionId}
      placeholder="Search by reference ID"
      rightElement={
        <InputRightElement>
          <IconButton
            variant="clear"
            colorScheme="secondary"
            size="sm"
            onClick={handleCollapse}
            icon={<BiX />}
            aria-label="Hide search"
          />
        </InputRightElement>
      }
    />
  )
}

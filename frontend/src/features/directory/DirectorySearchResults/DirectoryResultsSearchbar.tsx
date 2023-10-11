import { BiSearch } from 'react-icons/bi'
import { Icon, InputGroup, InputLeftElement } from '@chakra-ui/react'

import Input from '~components/Input'

export const DirectoryResultsSearchbar = ({
  activeSearch,
  setActiveSearch,
}: {
  activeSearch: string
  setActiveSearch: (val: string) => void
}) => {
  return (
    <InputGroup>
      <InputLeftElement>
        <Icon as={BiSearch} />
      </InputLeftElement>
      <Input
        placeholder="Search by keyword..."
        value={activeSearch}
        onChange={(e) => setActiveSearch(e.target.value)}
      />
    </InputGroup>
  )
}

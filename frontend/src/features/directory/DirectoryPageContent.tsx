import { useSearchParam } from 'react-use'

import { DirectorySearch } from './DirectorySearch'
import { DirectorySearchResults } from './DirectorySearchResults'

export const DirectoryPageContent = () => {
  const agency = useSearchParam('agency')

  return agency ? (
    <DirectorySearchResults agency={agency} />
  ) : (
    <DirectorySearch />
  )
}

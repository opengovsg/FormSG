import { useSearchParam } from 'react-use'

import { DirectorySearch } from './DirectorySearch'
import { DirectoryResults } from './DirectorySearchResults'

export const DirectoryPageContent = () => {
  const agency = useSearchParam('agency')

  return agency ? <DirectoryResults agency={agency} /> : <DirectorySearch />
}

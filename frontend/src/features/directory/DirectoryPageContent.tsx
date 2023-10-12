import { useSearchParam } from 'react-use'

import { DirectoryResults } from './DirectoryResults'
import { DirectorySearch } from './DirectorySearch'

export const DirectoryPageContent = () => {
  const agency = useSearchParam('agency')

  return agency ? (
    <DirectoryResults agencyShortName={agency} />
  ) : (
    <DirectorySearch />
  )
}

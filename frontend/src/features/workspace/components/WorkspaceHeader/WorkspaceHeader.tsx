import { useState } from 'react'
import { BiPlus } from 'react-icons/bi'
import { Skeleton, Text, Wrap } from '@chakra-ui/react'

import Button from '~components/Button'

import { SortOption } from '~features/workspace/types'

import { WorkspaceSortDropdown } from './WorkspaceSortDropdown'

export interface WorkspaceHeaderProps {
  /**
   * Number of forms in the workspace.
   * Defaults to '-' (to account for loading or error states)
   */
  totalFormCount?: number | '-'
  isLoading: boolean
}

/**
 * Header for listing number of forms, or updating the sort order of listed forms, etc.
 */
export const WorkspaceHeader = ({
  totalFormCount = '-',
  isLoading,
}: WorkspaceHeaderProps): JSX.Element => {
  const [sortOption, setSortOption] = useState(SortOption.LastUpdated)

  return (
    <Wrap my="2rem" justify="space-between" align="center" shouldWrapChildren>
      <Text as="h2" textStyle="h2" display="flex" color="secondary.500">
        All forms (<Skeleton isLoaded={!isLoading}>{totalFormCount}</Skeleton>)
      </Text>
      <Wrap shouldWrapChildren spacing="1rem">
        <WorkspaceSortDropdown
          value={sortOption}
          onChange={setSortOption}
          isDisabled={isLoading}
        />
        <Button isDisabled={isLoading} leftIcon={<BiPlus fontSize="1.5rem" />}>
          Create form
        </Button>
      </Wrap>
    </Wrap>
  )
}

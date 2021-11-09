import { useState } from 'react'
import { BiPlus } from 'react-icons/bi'
import { Skeleton, Text, Wrap } from '@chakra-ui/react'

import Button from '~components/Button'

import { SortOption } from '~features/workspace/types'

import { WorkspaceSortDropdown } from './WorkspaceSortDropdown'

export interface WorkspaceHeaderProps {
  /**
   * Number of forms in the workspace. If `undefined`, will be in a loading state.
   */
  numForms?: number
}

/**
 * Header for listing number of forms, or updating the sort order of listed forms, etc.
 */
export const WorkspaceHeader = ({
  numForms,
}: WorkspaceHeaderProps): JSX.Element => {
  const [sortOption, setSortOption] = useState(SortOption.LastUpdated)

  return (
    <Wrap my="2rem" justify="space-between" align="center" shouldWrapChildren>
      <Text as="h2" textStyle="h2" display="flex" color="secondary.500">
        All forms (<Skeleton isLoaded={!!numForms}>{numForms ?? '00'}</Skeleton>
        )
      </Text>
      <Wrap shouldWrapChildren spacing="1rem">
        <WorkspaceSortDropdown
          value={sortOption}
          onChange={setSortOption}
          isDisabled={!numForms}
        />
        <Button isDisabled={!numForms} leftIcon={<BiPlus fontSize="1.5rem" />}>
          Create form
        </Button>
      </Wrap>
    </Wrap>
  )
}

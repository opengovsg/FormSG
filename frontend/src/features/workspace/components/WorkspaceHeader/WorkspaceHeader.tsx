import { useMemo, useState } from 'react'
import { BiPlus } from 'react-icons/bi'
import { Box, Flex, Grid, Skeleton, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

import { MobileWorkspaceSearchbar } from '../WorkspaceSearchbar/MobileWorkspaceSearchbar'
import { WorkspaceSearchbar } from '../WorkspaceSearchbar/WorkspaceSearchbar'

export interface WorkspaceHeaderProps {
  handleOpenCreateFormModal: () => void
}

/**
 * Header for listing number of forms, or updating the sort order of listed forms, etc.
 */
export const WorkspaceHeader = ({
  handleOpenCreateFormModal,
}: WorkspaceHeaderProps): JSX.Element => {
  const isMobile = useIsMobile()
  const {
    isLoading,
    totalFormsCount,
    displayedFormsCount,
    activeSearch,
    setActiveSearch,
    activeFilter,
    setActiveFilter,
  } = useWorkspaceContext()

  const [searchExpanded, setSearchExpanded] = useState<boolean>(false)

  const headerText = useMemo(
    () =>
      activeSearch || activeFilter
        ? simplur`Showing ${displayedFormsCount} of ${totalFormsCount} form[|s]`
        : `All forms (${totalFormsCount})`,
    [activeFilter, activeSearch, displayedFormsCount, totalFormsCount],
  )

  return (
    <Grid
      gridTemplateAreas={{
        base: searchExpanded
          ? "'header filter' 'search search' 'create create'"
          : "'header search filter' 'create create create'",
        md: searchExpanded
          ? "'header filter create' 'search search search'"
          : "'header search filter create'",
        lg: "'header searchfilter create'",
      }}
      gridTemplateColumns={{
        base: searchExpanded ? '1fr auto' : '1fr auto auto',
        md: searchExpanded ? '1fr auto auto' : '1fr auto auto auto',
        lg: '1fr auto auto',
      }}
      gap="1rem"
    >
      <Flex
        gridArea="header"
        flex={1}
        display="flex"
        color="secondary.500"
        alignSelf="center"
      >
        <Skeleton isLoaded={!isLoading}>
          <Text
            textStyle={
              isMobile && (activeFilter !== null || activeSearch !== '')
                ? 'subhead-1'
                : 'h2'
            }
          >
            {headerText}
          </Text>
        </Skeleton>
      </Flex>

      {/* Combination box used in desktop mode. */}
      {!isMobile ? (
        <Box gridArea="searchfilter">
          <WorkspaceSearchbar
            onChange={setActiveSearch}
            placeholder="Search by title"
            onFilter={setActiveFilter}
          />
        </Box>
      ) : null}

      <MobileWorkspaceSearchbar
        onChange={setActiveSearch}
        placeholder="Search by title"
        onFilter={setActiveFilter}
      />

      <Button
        gridArea="create"
        isFullWidth={isMobile}
        isDisabled={isLoading}
        onClick={handleOpenCreateFormModal}
        leftIcon={<BiPlus fontSize="1.5rem" />}
      >
        Create form
      </Button>
    </Grid>
  )
}

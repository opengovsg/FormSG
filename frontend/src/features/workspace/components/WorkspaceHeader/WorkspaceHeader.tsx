import { useMemo } from 'react'
import { BiPlus } from 'react-icons/bi'
import {
  Box,
  Flex,
  Grid,
  Skeleton,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import simplur from 'simplur'

import { useIsDesktop, useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

import { MobileWorkspaceSearchbar } from '../WorkspaceSearchbar/MobileWorkspaceSearchbar'
import { WorkspaceSearchbar } from '../WorkspaceSearchbar/WorkspaceSearchbar'

import { WorkspaceEditMenu } from './WorkspaceEditMenu'

export interface WorkspaceHeaderProps {
  handleOpenCreateFormModal: () => void
}

/**
 * Header for editing workspace, or updating the sort order of listed forms, etc.
 */
export const WorkspaceHeader = ({
  handleOpenCreateFormModal,
}: WorkspaceHeaderProps): JSX.Element => {
  const isMobile = useIsMobile()
  const isDesktop = useIsDesktop()

  const {
    isLoading,
    totalFormsCount,
    displayedFormsCount,
    activeSearch,
    setActiveSearch,
    activeFilter,
    setActiveFilter,
    hasActiveSearchOrFilter,
    activeWorkspace,
  } = useWorkspaceContext()

  const { isOpen: isSearchExpanded, onToggle: onToggleSearchExpansion } =
    useDisclosure()

  const headerText = useMemo(
    () =>
      hasActiveSearchOrFilter
        ? simplur`Showing ${displayedFormsCount} of ${totalFormsCount} form[|s]`
        : `${activeWorkspace.title}`,
    [
      displayedFormsCount,
      hasActiveSearchOrFilter,
      totalFormsCount,
      activeWorkspace,
    ],
  )

  return (
    <Grid
      gridTemplateAreas={{
        // Note: these gridTemplateAreas labels are used also in MobileWorkspaceSearchbar.
        base: isSearchExpanded
          ? "'header filter' 'search search' 'create create'"
          : "'header searchIcon filter' 'create create create'",
        md: isSearchExpanded
          ? "'header filter create' 'search search search'"
          : "'header searchIcon filter create'",
        lg: "'header searchFilter create'",
      }}
      gridTemplateColumns={{
        base: isSearchExpanded ? '1fr auto' : '1fr auto auto',
        md: isSearchExpanded ? '1fr auto auto' : '1fr auto auto auto',
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
        <Skeleton isLoaded={!isLoading} alignSelf="center">
          <Flex maxW={{ base: '9.75rem', md: '30.5rem' }}>
            <Text textStyle="h2" color="secondary.500" noOfLines={1}>
              {headerText}
            </Text>
            {!hasActiveSearchOrFilter && (
              <Text textStyle="h2" color="secondary.500">
                &nbsp;({totalFormsCount})
              </Text>
            )}
          </Flex>
        </Skeleton>
        {activeWorkspace._id && (
          <Skeleton isLoaded={!isLoading}>
            <WorkspaceEditMenu />
          </Skeleton>
        )}
      </Flex>

      {isDesktop ? (
        // Combination box used in desktop mode.
        <Box gridArea="searchFilter">
          {totalFormsCount ? (
            <WorkspaceSearchbar
              placeholder="Search by title"
              value={activeSearch}
              onChange={setActiveSearch}
              filterValue={activeFilter}
              onFilter={setActiveFilter}
            />
          ) : null}
        </Box>
      ) : (
        <MobileWorkspaceSearchbar
          isExpanded={isSearchExpanded}
          onToggleExpansion={onToggleSearchExpansion}
          placeholder="Search by title"
          value={activeSearch}
          onChange={setActiveSearch}
          filterValue={activeFilter}
          onFilter={setActiveFilter}
        />
      )}

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

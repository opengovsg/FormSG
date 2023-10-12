import { useMemo } from 'react'
import {
  BiDirections,
  BiDuplicate,
  BiFile,
  BiPlus,
  BiShareAlt,
  BiShow,
  BiTrash,
  BiUserPlus,
} from 'react-icons/bi'
import {} from 'react-icons/io'
import { Link as ReactLink } from 'react-router-dom'
import {
  Box,
  ButtonGroup,
  Flex,
  Grid,
  MenuButton,
  MenuDivider,
  Skeleton,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import simplur from 'simplur'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import { useIsDesktop, useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

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
  } = useWorkspaceContext()

  const { isOpen: isSearchExpanded, onToggle: onToggleSearchExpansion } =
    useDisclosure()

  const headerText = useMemo(
    () =>
      hasActiveSearchOrFilter
        ? simplur`Showing ${displayedFormsCount} of ${totalFormsCount} form[|s]`
        : `All forms (${totalFormsCount})`,
    [displayedFormsCount, hasActiveSearchOrFilter, totalFormsCount],
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
        <Skeleton isLoaded={!isLoading}>
          <Text
            textStyle={isMobile && hasActiveSearchOrFilter ? 'subhead-1' : 'h2'}
          >
            {headerText}
          </Text>
        </Skeleton>
      </Flex>

      {isDesktop ? (
        // Combination box used in desktop mode.
        <Box gridArea="searchFilter">
          <WorkspaceSearchbar
            placeholder="Search by title"
            value={activeSearch}
            onChange={setActiveSearch}
            filterValue={activeFilter}
            onFilter={setActiveFilter}
          />
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

      {/* <Button
        gridArea="create"
        isFullWidth={isMobile}
        isDisabled={isLoading}
        onClick={handleOpenCreateFormModal}
        rightIcon={<BiPlus fontSize="1.5rem" />}
      >
        Create
      </Button> */}
      <ButtonActionDropdown
        handleOpenCreateFormModal={handleOpenCreateFormModal}
      />
    </Grid>
  )
}

const ButtonActionDropdown = ({ handleOpenCreateFormModal }) => {
  return (
    <Menu
      placement="bottom-end"
      // Prevents massive render load when there are a ton of rows
      isLazy
    >
      {({ isOpen }) => (
        <>
          <ButtonGroup
            isAttached
            // variant="outline"
            colorScheme="secondary"
            display={{ base: 'none', md: 'flex' }}
          >
            <Button
              // to={adminFormLink}
              onClick={handleOpenCreateFormModal}
              px="1.5rem"
              mr="-1px"
              borderEndRadius={0}
            >
              Create
            </Button>
            <MenuButton
              as={IconButton}
              borderStartRadius={0}
              _active={{ bg: 'secondary.100' }}
              isActive={isOpen}
              aria-label="More actions"
              icon={isOpen ? <BxsChevronUp /> : <BxsChevronDown />}
            />
          </ButtonGroup>
          <Menu.List>
            <Menu.Item
              onClick={handleOpenCreateFormModal}
              icon={<BiFile fontSize="1.25rem" />}
            >
              Form
            </Menu.Item>
            <Menu.Item
              onClick={handleOpenCreateFormModal}
              icon={<BiDirections fontSize="1.25rem" />}
            >
              Directory
            </Menu.Item>
          </Menu.List>
        </>
      )}
    </Menu>
  )
}

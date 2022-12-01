import { useCallback, useMemo, useState } from 'react'
import { BiCheck, BiFilter, BiPlus } from 'react-icons/bi'
import {
  Box,
  ButtonGroup,
  Circle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Grid,
  Icon,
  MenuButton,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import simplur from 'simplur'

import { useIsMobile } from '~hooks/useIsMobile'
import Button, { ButtonProps } from '~components/Button'
import IconButton, { IconButtonProps } from '~components/IconButton'
import Menu from '~components/Menu'
import Searchbar from '~components/Searchbar'

import { FilterOption } from '~features/workspace/types'
import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

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
    defaultFilterOption,
    filterOptions,
    activeSearch,
    setActiveSearch,
    activeFilter,
    setActiveFilter,
  } = useWorkspaceContext()

  const [searchExpanded, setSearchExpanded] = useState<boolean>(false)
  const { isOpen, onClose, onOpen } = useDisclosure()

  const mobileDrawerExtraButtonProps: Partial<ButtonProps> = useMemo(
    () => ({
      isFullWidth: true,
      justifyContent: 'flex-start',
      variant: 'clear',
      colorScheme: 'secondary',
      textStyle: 'body-1',
    }),
    [],
  )

  const handleExpandSearchbar = useCallback(() => {
    setSearchExpanded(true)
  }, [])

  const handleCollapseSearchbar = useCallback(() => {
    setSearchExpanded(false)
    setActiveSearch('')
    setActiveFilter(null)
  }, [setActiveFilter, setActiveSearch])

  const handleSelectFilter = useCallback(
    (opt: string) =>
      setActiveFilter(
        opt === defaultFilterOption ? null : (opt as FilterOption),
      ),
    [defaultFilterOption, setActiveFilter],
  )

  const handleSelectFilterFromDrawer = useCallback(
    (filterOption: FilterOption | null) => {
      setActiveFilter(filterOption)
      onClose()
    },
    [onClose, setActiveFilter],
  )

  const renderFilterButton = useCallback(
    (isActive: boolean) => {
      const buttonProps: IconButtonProps = {
        'aria-label': 'Filter forms',
        variant: 'clear',
        colorScheme: 'secondary',
        backgroundColor: isActive || activeFilter ? 'neutral.200' : undefined,
        icon: <BiFilter />,
      }
      return (
        <>
          {isMobile ? (
            <IconButton onClick={onOpen} icon={<BiFilter />} {...buttonProps} />
          ) : (
            <MenuButton as={IconButton} {...buttonProps} isActive />
          )}
          {activeFilter && (
            <Icon
              as={Circle}
              bg="primary.500"
              fontSize="0.4rem"
              ml="-1rem"
              mr="0.6rem"
              mb="0.4rem"
              position="relative"
              zIndex={0}
            />
          )}
        </>
      )
    },
    [activeFilter, isMobile, onOpen],
  )

  const renderFilterOption = useCallback(
    (filterOption: FilterOption | null) => {
      return (
        <Stack
          direction="row"
          justify="space-between"
          alignItems="center"
          w="100%"
        >
          <Text>{filterOption ?? defaultFilterOption}</Text>
          {activeFilter === filterOption ? <BiCheck /> : null}
        </Stack>
      )
    },
    [activeFilter, defaultFilterOption],
  )

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

      {/* 'search' and 'filter' only used in mobile & tablet mode. */}
      <Box gridArea="search" display={{ lg: 'none' }}>
        <Searchbar
          onExpandIconClick={handleExpandSearchbar}
          onCollapseIconClick={handleCollapseSearchbar}
          onChange={setActiveSearch}
          placeholder="Search by title"
        />
      </Box>

      <Box gridArea="filter" display={{ lg: 'none' }}>
        {isMobile ? (
          renderFilterButton(isOpen)
        ) : (
          <Menu placement="bottom-end">
            {({ isOpen }) => (
              <>
                {renderFilterButton(isOpen)}
                <Menu.List>
                  {[null, ...Object.values(FilterOption)].map((option, i) => (
                    <Menu.Item key={i} onClick={() => setActiveFilter(option)}>
                      {renderFilterOption(option)}
                    </Menu.Item>
                  ))}
                </Menu.List>
              </>
            )}
          </Menu>
        )}
      </Box>

      {/* Combination box used in desktop mode. */}
      <Box gridArea="searchfilter" display={{ base: 'none', lg: 'flex' }}>
        <Searchbar
          onExpandIconClick={handleExpandSearchbar}
          onCollapseIconClick={handleCollapseSearchbar}
          onChange={setActiveSearch}
          placeholder="Search by title"
          isExpandable={false}
          filterValue={defaultFilterOption}
          filterOptions={filterOptions}
          onFilter={handleSelectFilter}
        />
      </Box>

      <Button
        gridArea="create"
        isFullWidth={isMobile}
        isDisabled={isLoading}
        onClick={handleOpenCreateFormModal}
        leftIcon={<BiPlus fontSize="1.5rem" />}
      >
        Create form
      </Button>

      <Drawer placement="bottom" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent borderTopRadius="0.25rem">
          <DrawerBody px={0} py="0.5rem">
            <ButtonGroup flexDir="column" spacing={0} w="100%">
              {[null, ...Object.values(FilterOption)].map(
                (filterOption, idx) => (
                  <Button
                    key={idx}
                    {...mobileDrawerExtraButtonProps}
                    onClick={() => handleSelectFilterFromDrawer(filterOption)}
                  >
                    {renderFilterOption(filterOption)}
                  </Button>
                ),
              )}
            </ButtonGroup>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Grid>
  )
}

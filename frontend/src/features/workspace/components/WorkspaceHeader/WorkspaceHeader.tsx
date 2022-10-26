import { useCallback, useMemo } from 'react'
import { BiFilter, BiPlus } from 'react-icons/bi'
import {
  Box,
  ButtonGroup,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Grid,
  MenuButton,
  Skeleton,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button, { ButtonProps } from '~components/Button'
import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

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
    isFilterOn,
    activeFilter,
    setActiveFilter,
  } = useWorkspaceContext()
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

  const handleSetActiveFilterFromDrawer = useCallback(
    (filterOption: FilterOption | null) => {
      setActiveFilter(filterOption)
      onClose()
    },
    [onClose, setActiveFilter],
  )

  return (
    <Grid
      gridTemplateAreas={{
        base: "'header filter' 'create create'",
        md: "'header filter create'",
      }}
      gridTemplateColumns={{ base: '1fr auto', md: '1fr auto auto' }}
      gap="1rem"
    >
      <Text
        gridArea="header"
        flex={1}
        as="h2"
        textStyle="h2"
        display="flex"
        color="secondary.500"
        alignSelf="center"
      >
        {isFilterOn ? (
          <>
            Showing&nbsp;
            <Skeleton isLoaded={!isLoading}>{displayedFormsCount}</Skeleton>
            &nbsp;of&nbsp;
          </>
        ) : (
          'All forms ('
        )}
        <Skeleton isLoaded={!isLoading}>{totalFormsCount ?? '---'}</Skeleton>
        {isFilterOn ? <>&nbsp;forms</> : ')'}
      </Text>
      <Box gridArea="filter">
        {isMobile ? (
          <IconButton
            aria-label="Filter forms"
            variant="clear"
            colorScheme="secondary"
            onClick={onOpen}
            icon={<BiFilter />}
          />
        ) : (
          <Menu placement="bottom-end">
            {({ isOpen }) => (
              <>
                <MenuButton
                  as={Button}
                  variant="clear"
                  colorScheme="secondary"
                  isActive={isOpen}
                  aria-label="Filter forms"
                  leftIcon={<BiFilter />}
                >
                  Filter
                  {isFilterOn ? `: ${activeFilter}` : ''}
                </MenuButton>
                <Menu.List>
                  <Menu.Item onClick={() => setActiveFilter(null)}>
                    All forms
                  </Menu.Item>
                  {Object.values(FilterOption).map((filterOption) => (
                    <Menu.Item onClick={() => setActiveFilter(filterOption)}>
                      {filterOption}
                    </Menu.Item>
                  ))}
                </Menu.List>
              </>
            )}
          </Menu>
        )}
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
              <Button
                {...mobileDrawerExtraButtonProps}
                onClick={() => handleSetActiveFilterFromDrawer(null)}
              >
                All forms
              </Button>
              {Object.values(FilterOption).map((filterOption) => (
                <Button
                  {...mobileDrawerExtraButtonProps}
                  onClick={() => handleSetActiveFilterFromDrawer(filterOption)}
                >
                  {filterOption}
                </Button>
              ))}
            </ButtonGroup>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Grid>
  )
}

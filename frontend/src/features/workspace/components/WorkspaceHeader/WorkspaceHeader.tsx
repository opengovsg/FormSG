import { useCallback, useMemo } from 'react'
import { BiCheck, BiFilter, BiPlus } from 'react-icons/bi'
import {
  Avatar,
  Box,
  ButtonGroup,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Grid,
  Icon,
  MenuButton,
  Skeleton,
  Stack,
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

  const renderFilterButton = useCallback(
    (filterOption: FilterOption | null) => {
      return (
        <Stack
          direction="row"
          justify="space-between"
          alignItems="center"
          w="100%"
        >
          <Text>{filterOption ?? 'All forms'}</Text>
          {activeFilter === filterOption ? <BiCheck /> : null}
        </Stack>
      )
    },
    [activeFilter],
  )

  const headerStyle = useMemo(
    () => (isMobile && activeFilter != null ? 'h3' : 'h2'),
    [activeFilter, isMobile],
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
        as={headerStyle}
        textStyle={headerStyle}
        display="flex"
        color="secondary.500"
        alignSelf="center"
      >
        {activeFilter ? (
          <>
            Showing&nbsp;
            <Skeleton isLoaded={!isLoading}>{displayedFormsCount}</Skeleton>
            &nbsp;of&nbsp;
          </>
        ) : (
          'All forms ('
        )}
        <Skeleton isLoaded={!isLoading}>{totalFormsCount ?? '---'}</Skeleton>
        {activeFilter ? <>&nbsp;forms</> : ')'}
      </Text>
      <Box gridArea="filter">
        {isMobile ? (
          <>
            <IconButton
              aria-label="Filter forms"
              variant="clear"
              colorScheme="secondary"
              backgroundColor={activeFilter ? 'neutral.200' : undefined}
              onClick={onOpen}
              icon={<BiFilter />}
            />
            {activeFilter && (
              <Icon
                as={Avatar}
                size="md"
                bg="primary.500"
                name="1"
                textColor="white"
                fontSize="1.2rem"
                m="-0.6rem"
              />
            )}
          </>
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
                  {activeFilter ? `: ${activeFilter}` : ''}
                </MenuButton>
                <Menu.List>
                  <Menu.Item onClick={() => setActiveFilter(null)}>
                    {renderFilterButton(null)}
                  </Menu.Item>
                  {Object.values(FilterOption).map((filterOption) => (
                    <Menu.Item onClick={() => setActiveFilter(filterOption)}>
                      {renderFilterButton(filterOption)}
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
                key={0}
                {...mobileDrawerExtraButtonProps}
                onClick={() => handleSetActiveFilterFromDrawer(null)}
              >
                {renderFilterButton(null)}
              </Button>
              {Object.values(FilterOption).map((filterOption, idx) => (
                <Button
                  key={idx + 1}
                  {...mobileDrawerExtraButtonProps}
                  onClick={() => handleSetActiveFilterFromDrawer(filterOption)}
                >
                  {renderFilterButton(filterOption)}
                </Button>
              ))}
            </ButtonGroup>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Grid>
  )
}

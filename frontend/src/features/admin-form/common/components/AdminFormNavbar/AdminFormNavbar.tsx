import { useCallback, useMemo } from 'react'
import {
  BiDotsHorizontalRounded,
  BiLeftArrowAlt,
  BiShareAlt,
  BiShow,
  BiUserPlus,
} from 'react-icons/bi'
import { useLocation } from 'react-router-dom'
import {
  Box,
  ButtonGroup,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Grid,
  GridItem,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react'

import { AdminFormDto } from '~shared/types/form/form'

import {
  ACTIVE_ADMINFORM_BUILDER_ROUTE_REGEX,
  ADMINFORM_BUILD_SUBROUTE,
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_SETTINGS_SUBROUTE,
} from '~constants/routes'
import { useDraggable } from '~hooks/useDraggable'
import Button, { ButtonProps } from '~components/Button'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'
import { NavigationTab, NavigationTabList } from '~templates/NavigationTabs'

import { AdminFormNavbarDetails } from './AdminFormNavbarDetails'

export interface AdminFormNavbarProps {
  /**
   * Minimum form info needed to render the navbar.
   * If not provided, the navbar will be in a loading state.
   */
  formInfo?: Pick<AdminFormDto, 'title' | 'lastModified'>

  viewOnly: boolean

  handleBackButtonClick: () => void
  handleAddCollabButtonClick: () => void
  handlePreviewFormButtonClick: () => void
  handleShareButtonClick: () => void
}

/**
 * @precondition Must have AdminFormTabProvider parent due to usage of TabList and Tab.
 */
export const AdminFormNavbar = ({
  formInfo,
  viewOnly,
  handleAddCollabButtonClick,
  handleBackButtonClick,
  handlePreviewFormButtonClick,
  handleShareButtonClick,
}: AdminFormNavbarProps): JSX.Element => {
  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const { pathname } = useLocation()

  const tabResponsiveVariant = useBreakpointValue({
    base: 'line-dark',
    xs: 'line-dark',
    lg: 'line-light',
  })

  const checkTabActive = useCallback(
    (to: string) => {
      const match = pathname.match(ACTIVE_ADMINFORM_BUILDER_ROUTE_REGEX)
      return (match?.[2] ?? '/') === `/${to}`
    },
    [pathname],
  )

  const mobileDrawerExtraButtonProps: Partial<ButtonProps> = useMemo(
    () => ({
      isFullWidth: true,
      iconSpacing: '1rem',
      justifyContent: 'flex-start',
      variant: 'clear',
      colorScheme: 'secondary',
      textStyle: 'body-1',
    }),
    [],
  )

  return (
    <Grid
      w="100vw"
      position="sticky"
      top={0}
      flexDir="column"
      templateColumns={{
        base: '1fr',
        lg: 'repeat(3, minmax(0, 1fr))',
      }}
      templateRows="min-content"
      templateAreas={{
        base: `'left right' 'actions actions' 'tabs tabs'`,
        lg: `'left tabs right'`,
      }}
      boxShadow={{ lg: '0 1px 1px var(--chakra-colors-neutral-300)' }}
      mb="1px"
      bg="white"
      zIndex="docked"
      flex={0}
    >
      <GridItem
        display="flex"
        flex="1 1 0"
        overflow="hidden"
        alignItems="center"
        gridArea="left"
        py="0.625rem"
        pl={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
        pr="1rem"
      >
        <Box>
          <IconButton
            mr="0.5rem"
            aria-label="Go back to dashboard"
            variant="clear"
            colorScheme="secondary"
            onClick={handleBackButtonClick}
            icon={<BiLeftArrowAlt />}
          />
        </Box>
        <AdminFormNavbarDetails formInfo={formInfo} />
      </GridItem>
      <NavigationTabList
        variant={tabResponsiveVariant}
        ref={ref}
        onMouseDown={onMouseDown}
        pt={{ base: '0.625rem', lg: 0 }}
        px={{ base: '1.25rem', lg: '1rem' }}
        w={{ base: '100vw', lg: 'initial' }}
        gridArea="tabs"
        borderBottom="none"
        justifySelf={{ base: 'flex-start', lg: 'center' }}
        alignSelf="center"
      >
        <NavigationTab
          hidden={viewOnly}
          to={ADMINFORM_BUILD_SUBROUTE}
          isActive={checkTabActive(ADMINFORM_BUILD_SUBROUTE)}
        >
          Create
        </NavigationTab>
        <NavigationTab
          hidden={viewOnly}
          to={ADMINFORM_SETTINGS_SUBROUTE}
          isActive={checkTabActive(ADMINFORM_SETTINGS_SUBROUTE)}
        >
          Settings
        </NavigationTab>
        <NavigationTab
          to={ADMINFORM_RESULTS_SUBROUTE}
          isActive={checkTabActive(ADMINFORM_RESULTS_SUBROUTE)}
        >
          Results
        </NavigationTab>
      </NavigationTabList>
      <Flex
        py="0.625rem"
        pl="1rem"
        pr={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
        flex={1}
        gridArea="right"
        justify="flex-end"
        align="center"
      >
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          aria-label="Form actions"
          onClick={onOpen}
          icon={<BiDotsHorizontalRounded />}
        />
        <Box display={{ base: 'none', md: 'flex' }}>
          <ButtonGroup spacing="0.5rem" isDisabled={!formInfo}>
            <Tooltip label="Manage collaborators">
              <IconButton
                aria-label="Manage collaborators"
                variant="outline"
                onClick={handleAddCollabButtonClick}
                icon={<BiUserPlus />}
              />
            </Tooltip>
            <Tooltip label="Preview form">
              <IconButton
                aria-label="Preview form"
                variant="outline"
                onClick={handlePreviewFormButtonClick}
                icon={<BiShow />}
              />
            </Tooltip>
            <Tooltip label="Share your form link">
              <Button onClick={handleShareButtonClick}>Share</Button>
            </Tooltip>
          </ButtonGroup>
        </Box>
      </Flex>
      <Drawer placement="bottom" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent borderTopRadius="0.25rem">
          <DrawerBody px={0} py="0.5rem">
            <ButtonGroup
              flexDir="column"
              isDisabled={!formInfo}
              spacing={0}
              w="100%"
            >
              <Button
                onClick={handlePreviewFormButtonClick}
                {...mobileDrawerExtraButtonProps}
                leftIcon={<BiShow fontSize="1.25rem" />}
              >
                Preview form
              </Button>
              <Button
                {...mobileDrawerExtraButtonProps}
                onClick={handleShareButtonClick}
                leftIcon={<BiShareAlt fontSize="1.25rem" />}
              >
                Share form link
              </Button>
              <Button
                {...mobileDrawerExtraButtonProps}
                onClick={handleAddCollabButtonClick}
                leftIcon={<BiUserPlus fontSize="1.25rem" />}
              >
                Manage collaborators
              </Button>
            </ButtonGroup>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Grid>
  )
}

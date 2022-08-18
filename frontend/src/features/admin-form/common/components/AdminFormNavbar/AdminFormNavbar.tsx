import { useMemo } from 'react'
import {
  BiDotsHorizontalRounded,
  BiHelpCircle,
  BiLeftArrowAlt,
  BiShareAlt,
  BiShow,
  BiUserPlus,
} from 'react-icons/bi'
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
  useDisclosure,
} from '@chakra-ui/react'

import { AdminFormDto } from '~shared/types/form/form'

import { FORM_GUIDE } from '~constants/links'
import {
  ADMINFORM_BUILD_SUBROUTE,
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_SETTINGS_SUBROUTE,
} from '~constants/routes'
import { useDraggable } from '~hooks/useDraggable'
import Button, { ButtonProps } from '~components/Button'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { AdminFormNavbarDetails } from './AdminFormNavbarDetails'
import { FauxTabLink, FauxTabs } from './FauxTabs'

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

  const ADMINFORM_ROUTES = [
    ADMINFORM_BUILD_SUBROUTE,
    ADMINFORM_SETTINGS_SUBROUTE,
    ADMINFORM_RESULTS_SUBROUTE,
  ]

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
      <FauxTabs ref={ref} onMouseDown={onMouseDown}>
        <FauxTabLink
          hidden={viewOnly}
          isDisabled={!formInfo}
          to={ADMINFORM_ROUTES[0]}
        >
          Create
        </FauxTabLink>
        <FauxTabLink
          hidden={viewOnly}
          isDisabled={!formInfo}
          to={ADMINFORM_ROUTES[1]}
        >
          Settings
        </FauxTabLink>
        <FauxTabLink hidden={viewOnly} isDisabled to={ADMINFORM_ROUTES[2]}>
          Results
        </FauxTabLink>
      </FauxTabs>
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
            <Tooltip label="Help">
              <IconButton
                aria-label="Help"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  window.open(FORM_GUIDE)
                }}
                icon={<BiHelpCircle />}
              />
            </Tooltip>
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

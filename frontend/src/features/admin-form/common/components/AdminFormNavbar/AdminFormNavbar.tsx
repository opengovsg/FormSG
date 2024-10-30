import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BiDotsHorizontalRounded,
  BiShareAlt,
  BiShow,
  BiUserPlus,
} from 'react-icons/bi'
import { GoDotFill } from 'react-icons/go'
import { Link as ReactLink, useLocation } from 'react-router-dom'
import {
  Box,
  ButtonGroup,
  chakra,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Grid,
  GridItem,
  Icon,
  Skeleton,
  Text,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react'
import { format } from 'date-fns'

import { SeenFlags } from '~shared/types'
import { AdminFormDto, FormResponseMode } from '~shared/types/form/form'

import {
  ACTIVE_ADMINFORM_BUILDER_ROUTE_REGEX,
  ADMINFORM_BUILD_SUBROUTE,
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_SETTINGS_SUBROUTE,
} from '~constants/routes'
import { useDraggable } from '~hooks/useDraggable'
import { noPrintCss } from '~utils/noPrintCss'
import Button, { ButtonProps } from '~components/Button'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'
import { NavigationTab, NavigationTabList } from '~templates/NavigationTabs'

import { SeenFlagsMapVersion } from '~features/user/constants'
import { useUserMutations } from '~features/user/mutations'
import { useUser } from '~features/user/queries'
import { getShowFeatureFlagLastSeen } from '~features/user/utils'

import { AdminFormNavbarBreadcrumbs } from './AdminFormNavbarBreadcrumbs'

export interface AdminFormNavbarProps {
  /**
   * Minimum form info needed to render the navbar.
   * If not provided, the navbar will be in a loading state.
   */
  formInfo?: AdminFormDto
  viewOnly: boolean
  handleAddCollabButtonClick: () => void
  handleShareButtonClick: () => void
  previewFormLink: string
}

/**
 * @precondition Must have AdminFormTabProvider parent due to usage of TabList and Tab.
 */
export const AdminFormNavbar = ({
  formInfo,
  viewOnly,
  handleAddCollabButtonClick,
  handleShareButtonClick,
  previewFormLink,
}: AdminFormNavbarProps): JSX.Element => {
  const { t } = useTranslation()
  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const { pathname } = useLocation()

  const { user, isLoading: isUserLoading } = useUser()
  const { updateLastSeenFlagMutation } = useUserMutations()
  const shouldShowSettingsReddot = useMemo(() => {
    const isMrf = formInfo?.responseMode === FormResponseMode.Multirespondent

    if (isUserLoading || !user || isMrf) return false
    return getShowFeatureFlagLastSeen(user, SeenFlags.SettingsNotification)
  }, [isUserLoading, user, formInfo?.responseMode])

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

  const renderLastModified = useMemo(() => {
    const lastModified = formInfo ? new Date(formInfo.lastModified) : new Date()
    return (
      <Skeleton isLoaded={!!formInfo}>
        <Text
          textStyle="legal"
          textTransform="uppercase"
          color="neutral.700"
          textAlign="right"
        >
          {/* Use spans with nowrap to break the second half of the date as a group */}
          <chakra.span>Saved at {format(lastModified, 'h:mm a')}, </chakra.span>
          <chakra.span whiteSpace="nowrap">
            {format(lastModified, 'dd LLL y')}
          </chakra.span>
        </Text>
      </Skeleton>
    )
  }, [formInfo])

  return (
    <Grid
      sx={noPrintCss}
      w="100vw"
      position="sticky"
      top={0}
      flexDir="column"
      templateColumns={{
        base: 'auto auto',
        lg: 'repeat(3, minmax(0, 1fr))',
      }}
      templateRows="min-content"
      templateAreas={{
        base: `'left right' 'tabs tabs'`,
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
        <AdminFormNavbarBreadcrumbs formInfo={formInfo} />
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
          {t('features.adminForm.navbar.tabs.create')}
        </NavigationTab>
        <NavigationTab
          hidden={viewOnly}
          to={ADMINFORM_SETTINGS_SUBROUTE}
          isActive={checkTabActive(ADMINFORM_SETTINGS_SUBROUTE)}
          onClick={() => {
            if (shouldShowSettingsReddot) {
              updateLastSeenFlagMutation.mutate({
                flag: SeenFlags.SettingsNotification,
                version: SeenFlagsMapVersion[SeenFlags.SettingsNotification],
              })
            }
          }}
        >
          {t('features.adminForm.navbar.tabs.settings')}
          {shouldShowSettingsReddot ? (
            <Icon
              as={GoDotFill}
              color="danger.500"
              position="absolute"
              right="-8px"
              top="2px"
            />
          ) : null}
        </NavigationTab>
        <NavigationTab
          to={ADMINFORM_RESULTS_SUBROUTE}
          isActive={checkTabActive(ADMINFORM_RESULTS_SUBROUTE)}
        >
          {t('features.adminForm.navbar.tabs.results')}
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
          aria-label={t('features.adminForm.navbar.formActions')}
          onClick={onOpen}
          icon={<BiDotsHorizontalRounded />}
        />
        <Box display={{ base: 'none', md: 'flex' }}>
          <Flex pr="1rem" alignItems="center">
            {renderLastModified}
          </Flex>
          <ButtonGroup spacing="0.5rem" isDisabled={!formInfo}>
            <Tooltip label={t('features.adminForm.navbar.manageCollaborators')}>
              <IconButton
                aria-label={t('features.adminForm.navbar.manageCollaborators')}
                variant="outline"
                onClick={handleAddCollabButtonClick}
                icon={<BiUserPlus />}
              />
            </Tooltip>
            <Tooltip label={t('features.adminForm.navbar.previewForm')}>
              <IconButton
                as={ReactLink}
                aria-label={t('features.adminForm.navbar.previewForm')}
                variant="outline"
                to={previewFormLink}
                target="_blank"
                icon={<BiShow />}
              />
            </Tooltip>
            <Tooltip label={t('features.adminForm.navbar.shareBtn.tooltip')}>
              <Button onClick={handleShareButtonClick}>
                {t('features.adminForm.navbar.shareBtn.text')}
              </Button>
            </Tooltip>
          </ButtonGroup>
        </Box>
      </Flex>
      <Drawer placement="bottom" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent borderTopRadius="0.25rem">
          <DrawerBody px={0} py="0.5rem">
            <Flex p="1rem">{renderLastModified}</Flex>
            <Divider />
            <ButtonGroup
              flexDir="column"
              isDisabled={!formInfo}
              spacing={0}
              w="100%"
            >
              <Button
                as={ReactLink}
                to={previewFormLink}
                target="_blank"
                {...mobileDrawerExtraButtonProps}
                leftIcon={<BiShow fontSize="1.25rem" />}
              >
                {t('features.adminForm.navbar.previewForm')}
              </Button>
              <Button
                {...mobileDrawerExtraButtonProps}
                onClick={handleShareButtonClick}
                leftIcon={<BiShareAlt fontSize="1.25rem" />}
              >
                {t('features.adminForm.navbar.shareBtn.textMobile')}
              </Button>
              <Button
                {...mobileDrawerExtraButtonProps}
                onClick={handleAddCollabButtonClick}
                leftIcon={<BiUserPlus fontSize="1.25rem" />}
              >
                {t('features.adminForm.navbar.manageCollaborators')}
              </Button>
            </ButtonGroup>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Grid>
  )
}

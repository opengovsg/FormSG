import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BiCodeBlock, BiCog, BiDollar, BiKey, BiMailSend } from 'react-icons/bi'
import { IconType } from 'react-icons/lib'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Flex,
  Spacer,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import { LanguageTranslation } from '~assets/icons/LanguageTranslation'
import { ADMINFORM_RESULTS_SUBROUTE, ADMINFORM_ROUTE } from '~constants/routes'
import { useDraggable } from '~hooks/useDraggable'

import { useUser } from '~features/user/queries'

import {
  AdminFormSideNav,
  AdminFormSideNavTab,
  SideNavCollapseControl,
} from '../common/AdminFormSideNav/AdminFormSideNav'
import { useSideNavCollapse } from '../common/AdminFormSideNav/useSideNavCollapse'
import { useAdminFormCollaborators } from '../common/queries'

import { SettingsTab } from './components/SettingsTab'
import { useAdminFormSettings } from './queries'
import { SettingsAuthPage } from './SettingsAuthPage'
import { SettingsEmailsPage } from './SettingsEmailsPage'
import { SettingsGeneralPage } from './SettingsGeneralPage'
import { SettingsMultiLangPage } from './SettingsMultiLangPage'
import { SettingsPaymentsPage } from './SettingsPaymentsPage'
import { SettingsWebhooksPage } from './SettingsWebhooksPage'

interface TabEntry {
  label: string
  navLabel?: string
  icon: IconType
  component: () => JSX.Element
  path: string
  showRedDot?: boolean
}

export const SettingsPage = (): JSX.Element => {
  const { formId, settingsTab } = useParams()
  const showNavLabels = useFeatureIsOn(featureFlags.sidebarNavLabels)
  const { isCollapsed, isMobile, toggle } = useSideNavCollapse()
  const { isLoading: isFormSettingLoading } = useAdminFormSettings()
  const { user, isLoading: isUserLoading } = useUser()
  const { t } = useTranslation()
  const {
    general: { title: generalTitle },
    singpass: { title: singpassTitle },
    emailNotifications: { title: emailNotificationsTitle },
    webhooks: { title: webhooksTitle },
    payments: { title: paymentsTitle },
    tabs: { multiLanguage, navLabels },
  } = t('features.adminForm.settings', { returnObjects: true })

  if (!formId) throw new Error('No formId provided')

  const { hasEditAccess, isLoading: isCollabLoading } =
    useAdminFormCollaborators(formId)
  const navigate = useNavigate()

  // Redirect view-only collaborators to results screen.
  useEffect(() => {
    if (!isCollabLoading && !hasEditAccess)
      navigate(`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}`)
  }, [formId, hasEditAccess, isCollabLoading, navigate])

  const multiLangTab =
    !isUserLoading &&
    !isFormSettingLoading &&
    user?.betaFlags?.multiLangTranslation
      ? {
          label: multiLanguage,
          navLabel: navLabels.multiLanguage,
          icon: LanguageTranslation,
          component: SettingsMultiLangPage,
          path: 'language',
        }
      : null

  const tabConfig: TabEntry[] = [
    {
      label: generalTitle,
      icon: BiCog,
      component: SettingsGeneralPage,
      path: 'general',
    },
    {
      label: singpassTitle,
      icon: BiKey,
      component: SettingsAuthPage,
      path: 'singpass',
    },
    {
      label: emailNotificationsTitle,
      navLabel: navLabels.emails,
      icon: BiMailSend,
      component: SettingsEmailsPage,
      path: 'email-notifications',
    },
    {
      label: webhooksTitle,
      icon: BiCodeBlock,
      component: SettingsWebhooksPage,
      path: 'webhooks',
    },
    {
      label: paymentsTitle,
      icon: BiDollar,
      component: SettingsPaymentsPage,
      path: 'payments',
    },
    multiLangTab,
  ].filter(Boolean) as TabEntry[]

  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()

  const tabIndex = tabConfig.findIndex(
    (tab) => tab.path === (settingsTab ?? 'general').toLowerCase(),
  )

  const handleTabChange = (index: number) => {
    navigate(`${ADMINFORM_ROUTE}/${formId}/settings/${tabConfig[index].path}`)
  }

  const tabPanels = (
    <TabPanels
      maxW="42.5rem"
      mx={showNavLabels ? 'auto' : undefined}
      minW={0}
      mt={showNavLabels ? 0 : { md: '1rem' }}
    >
      {tabConfig.map((tab) => (
        <TabPanel key={tab.label}>
          <tab.component />
        </TabPanel>
      ))}
    </TabPanels>
  )

  return (
    <Box
      overflow={showNavLabels ? 'hidden' : 'auto'}
      display={showNavLabels ? 'flex' : undefined}
      flexDirection={showNavLabels ? 'column' : undefined}
      minH={showNavLabels ? 0 : undefined}
      /**
       * HACK: Chromium browsers have a bug where sibling elements with `position: sticky` will not
       * be correctly calculated during a reflow. This causes the sibling to not have the correct
       * y-axis position.
       *
       * Setting the `position` to `sticky` or `relative` would workaround this issue. We're choosing
       * not to use `sticky` since it has more side effects and gotchas.
       */
      position="relative"
      flex={1}
    >
      <Tabs
        isLazy
        isManual
        orientation="vertical"
        variant="line"
        py={showNavLabels ? 0 : { base: '2.5rem', lg: '3.125rem' }}
        px={showNavLabels ? 0 : { base: '1.5rem', md: '1.75rem', lg: '2rem' }}
        flex={showNavLabels ? 1 : undefined}
        minH={showNavLabels ? 0 : undefined}
        index={tabIndex === -1 ? 0 : tabIndex}
        onChange={(index) => {
          handleTabChange(index)
        }}
      >
        {showNavLabels ? (
          isCollapsed ? (
            <SideNavCollapseControl
              isCollapsed
              onClick={toggle}
              trackingLabel="settings.sidebar.toggle_collapse"
            />
          ) : (
            <AdminFormSideNav
              footer={
                isMobile ? (
                  <SideNavCollapseControl
                    isCollapsed={false}
                    trackingLabel="settings.sidebar.toggle_collapse"
                    onClick={toggle}
                  />
                ) : undefined
              }
            >
              <TabList border={0} m={0} p={0} overflow="visible" gap="1rem">
                {tabConfig.map((tab) => (
                  <AdminFormSideNavTab
                    key={tab.path}
                    label={tab.navLabel ?? tab.label}
                    icon={<tab.icon fontSize="1.5rem" />}
                  />
                ))}
              </TabList>
            </AdminFormSideNav>
          )
        ) : (
          <Flex
            h="max-content"
            flex={1}
            flexShrink={0}
            ref={ref}
            onMouseDown={onMouseDown}
            position="sticky"
            zIndex={0}
            top={{ base: '2.5rem', lg: '3.125rem' }}
            borderTopColor="neutral.300"
            w={{ base: 'auto', lg: '21rem' }}
            __css={{
              scrollbarWidth: 0,
              /* Scrollbar for Chrome, Safari, Opera and Microsoft Edge */
              '&::-webkit-scrollbar': {
                width: 0,
                height: 0,
              },
            }}
          >
            <TabList
              overflowX="initial"
              display="inline-flex"
              w="max-content"
              mr={{ base: '1.5rem', md: '4rem', lg: '2rem' }}
              mb="calc(0.5rem - 2px)"
            >
              {tabConfig.map((tab) => (
                <SettingsTab
                  key={tab.label}
                  label={tab.label}
                  icon={tab.icon}
                  showNewBadge={tab.showRedDot}
                />
              ))}
            </TabList>
          </Flex>
        )}
        {showNavLabels ? (
          <Box
            flex={1}
            minW={0}
            overflowY="auto"
            px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
            py={{ base: '2.5rem', lg: '3.125rem' }}
          >
            {tabPanels}
          </Box>
        ) : (
          tabPanels
        )}
        {!showNavLabels && <Spacer />}
      </Tabs>
    </Box>
  )
}

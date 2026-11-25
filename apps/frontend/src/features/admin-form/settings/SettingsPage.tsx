import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BiCodeBlock, BiCog, BiDollar, BiKey, BiMailSend } from 'react-icons/bi'
import { IconType } from 'react-icons/lib'
import { useNavigate, useParams } from 'react-router'
import { Box, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react'

import { LanguageTranslation } from '~assets/icons/LanguageTranslation'
import { ADMINFORM_RESULTS_SUBROUTE, ADMINFORM_ROUTE } from '~constants/routes'

import { useUsesStepLoginRules } from '~features/admin-form/create/workflow/hooks/useUsesStepLoginRules'
import { useUser } from '~features/user/queries'

import {
  AdminFormSideNav,
  AdminFormSideNavTab,
  SideNavCollapseControl,
} from '../common/AdminFormSideNav/AdminFormSideNav'
import { useSideNavCollapse } from '../common/AdminFormSideNav/useSideNavCollapse'
import { useAdminFormCollaborators } from '../common/queries'

import { useIntegrationsFlags } from './hooks/useIntegrationsFlags'
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
  badgeText?: string
  icon: IconType
  component: () => JSX.Element
  path: string
}

export const SettingsPage = (): JSX.Element => {
  const { formId, settingsTab } = useParams()
  const usesStepLoginRules = useUsesStepLoginRules()
  const { isCollapsed, isMobile, toggle } = useSideNavCollapse()
  const { isLoading: isFormSettingLoading } = useAdminFormSettings()
  const { user, isLoading: isUserLoading } = useUser()
  const { t } = useTranslation()
  const { isIntegrationsTab } = useIntegrationsFlags()
  const {
    general: { title: generalTitle },
    singpass: { title: singpassTitle, loginTitle },
    emailNotifications: { title: emailNotificationsTitle },
    webhooks: { title: webhooksTitle, integrationsTitle },
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
          badgeText: t('features.common.betaBadgeLabel'),
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
      label: usesStepLoginRules ? loginTitle : singpassTitle,
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
      label: isIntegrationsTab ? integrationsTitle : webhooksTitle,
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

  const tabIndex = tabConfig.findIndex(
    (tab) => tab.path === (settingsTab ?? 'general').toLowerCase(),
  )

  const handleTabChange = (index: number) => {
    navigate(`${ADMINFORM_ROUTE}/${formId}/settings/${tabConfig[index].path}`)
  }

  return (
    <Box
      overflow="hidden"
      display="flex"
      flexDirection="column"
      minH={0}
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
        p={0}
        flex={1}
        minH={0}
        index={tabIndex === -1 ? 0 : tabIndex}
        onChange={(index) => {
          handleTabChange(index)
        }}
      >
        {isCollapsed ? (
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
                  badgeText={tab.badgeText}
                  icon={<tab.icon fontSize="1.5rem" />}
                />
              ))}
            </TabList>
          </AdminFormSideNav>
        )}
        <Box
          flex={1}
          minW={0}
          overflowY="auto"
          px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
          py={{ base: '2.5rem', lg: '3.125rem' }}
        >
          <TabPanels maxW="42.5rem" mx="auto" minW={0} mt={0}>
            {tabConfig.map((tab) => (
              <TabPanel key={tab.label}>
                <tab.component />
              </TabPanel>
            ))}
          </TabPanels>
        </Box>
      </Tabs>
    </Box>
  )
}

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiGitMerge, BiQuestionMark } from 'react-icons/bi'
import { Divider, Stack } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode, SeenFlags } from 'formsg-shared/types'

import { MultiParty, PhHandsClapping } from '~assets/icons'
import { BxsDockTop } from '~assets/icons/BxsDockTop'
import { BxsWidget } from '~assets/icons/BxsWidget'
import { FORM_GUIDE } from '~constants/links'
import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  DrawerTabs,
  useCreatePageSidebar,
} from '~features/admin-form/create/common/CreatePageSidebarContext/CreatePageSidebarContext'
import { SeenFlagsMapVersion } from '~features/user/constants'
import { useUserMutations } from '~features/user/mutations'
import { useUser } from '~features/user/queries'
import { getShowFeatureFlagLastSeen } from '~features/user/utils'

import {
  isDirtySelector,
  useDirtyFieldStore,
} from '../../builder-and-design/useDirtyFieldStore'
import {
  setToInactiveSelector,
  useFieldBuilderStore,
} from '../../builder-and-design/useFieldBuilderStore'
import { FEATURE_TOUR_IDS } from '../../featureTour/constants'

import { DrawerTabIcon } from './DrawerTabIcon'

export const CreatePageSidebar = (): JSX.Element | null => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const showNavLabels = useFeatureIsOn(featureFlags.sidebarNavLabels)

  const { data } = useAdminForm()
  const { user, isLoading: isUserLoading } = useUser()
  const { updateLastSeenFlagMutation } = useUserMutations()

  const shouldShowMrfWorkflowReddot = useMemo(() => {
    if (isUserLoading || !user) return false
    return getShowFeatureFlagLastSeen(user, SeenFlags.CreateBuilderMrfWorkflow)
  }, [isUserLoading, user])

  const setFieldsToInactive = useFieldBuilderStore(setToInactiveSelector)
  const isDirty = useDirtyFieldStore(isDirtySelector)
  const {
    activeTab,
    handleBuilderClick,
    handleDesignClick,
    handleLogicClick,
    handleEndpageClick,
    handleWorkflowClick,
  } = useCreatePageSidebar()

  const handleDrawerBuilderClick = useCallback(() => {
    // Always show create field drawer when sidebar icon is tapped on mobile.
    if (isMobile) {
      setFieldsToInactive()
    }
    handleBuilderClick(isDirty)
  }, [handleBuilderClick, isDirty, isMobile, setFieldsToInactive])

  const handleDrawerDesignClick = useCallback(
    () => handleDesignClick(isDirty),
    [handleDesignClick, isDirty],
  )

  const handleDrawerLogicClick = useCallback(
    () => handleLogicClick(isDirty),
    [handleLogicClick, isDirty],
  )

  const handleDrawerEndpageClick = useCallback(
    () => handleEndpageClick(isDirty),
    [handleEndpageClick, isDirty],
  )

  const handleDrawerWorkflowClick = useCallback(() => {
    handleWorkflowClick(isDirty)
    if (shouldShowMrfWorkflowReddot) {
      updateLastSeenFlagMutation.mutate({
        flag: SeenFlags.CreateBuilderMrfWorkflow,
        version: SeenFlagsMapVersion.createBuilderMrfWorkflow,
      })
    }
  }, [
    handleWorkflowClick,
    updateLastSeenFlagMutation,
    shouldShowMrfWorkflowReddot,
    isDirty,
  ])

  const isMrf = data?.responseMode === FormResponseMode.Multirespondent

  const workflowTab = isMrf ? (
    <DrawerTabIcon
      label={t('features.adminForm.sidebar.workflow.title')}
      navLabel={
        showNavLabels
          ? t('features.adminForm.sidebar.navLabels.workflow')
          : undefined
      }
      trackingLabel="create_builder.drawer_tab.add_workflow"
      icon={<MultiParty fontSize="1.5rem" />}
      onClick={handleDrawerWorkflowClick}
      isActive={activeTab === DrawerTabs.Workflow}
      showRedDot={shouldShowMrfWorkflowReddot}
    />
  ) : null

  return (
    <Stack
      bg="white"
      pos="sticky"
      top={0}
      px={showNavLabels ? '0.75rem' : '0.5rem'}
      py="1rem"
      borderRight="1px solid"
      borderColor="neutral.300"
      direction="column"
      justifyContent="space-between"
    >
      <Stack spacing={showNavLabels ? '1rem' : '0.5rem'}>
        <DrawerTabIcon
          label={t('features.adminForm.sidebar.fields.builder.addFields')}
          navLabel={
            showNavLabels
              ? t('features.adminForm.sidebar.navLabels.fields')
              : undefined
          }
          trackingLabel="create_builder.drawer_tab.add_fields"
          icon={<BxsWidget fontSize="1.5rem" />}
          onClick={handleDrawerBuilderClick}
          isActive={activeTab === DrawerTabs.Builder}
          id={FEATURE_TOUR_IDS[0].id}
        />
        <DrawerTabIcon
          label={t('features.adminForm.sidebar.headerAndInstructions.title')}
          navLabel={
            showNavLabels
              ? t('features.adminForm.sidebar.navLabels.header')
              : undefined
          }
          trackingLabel="create_builder.drawer_tab.edit_header"
          icon={<BxsDockTop fontSize="1.5rem" />}
          onClick={handleDrawerDesignClick}
          isActive={activeTab === DrawerTabs.Design}
          id={FEATURE_TOUR_IDS[1].id}
        />
        {/* Treatment slots Workflow into the middle, after Header. */}
        {showNavLabels && workflowTab}
        <DrawerTabIcon
          label={t('features.adminForm.sidebar.logic.addLogicBtn')}
          navLabel={
            showNavLabels
              ? t('features.adminForm.sidebar.navLabels.logic')
              : undefined
          }
          trackingLabel="create_builder.drawer_tab.add_logic"
          icon={<BiGitMerge fontSize="1.5rem" />}
          onClick={handleDrawerLogicClick}
          isActive={activeTab === DrawerTabs.Logic}
          id={FEATURE_TOUR_IDS[2].id}
        />
        <DrawerTabIcon
          label={t('features.adminForm.sidebar.thankYou.thankYouPage.title')}
          navLabel={
            showNavLabels
              ? t('features.adminForm.sidebar.navLabels.thankYou')
              : undefined
          }
          trackingLabel="create_builder.drawer_tab.edit_thank_you_page"
          icon={<PhHandsClapping fontSize="1.5rem" />}
          onClick={handleDrawerEndpageClick}
          isActive={activeTab === DrawerTabs.EndPage}
          id={FEATURE_TOUR_IDS[3].id}
        />
        {/* Control keeps production's layout: Workflow at the bottom, below a divider. */}
        {!showNavLabels && isMrf && (
          <>
            <Divider />
            {workflowTab}
          </>
        )}
      </Stack>
      <Tooltip label="Help" placement="right">
        <IconButton
          variant="solid"
          colorScheme="subtle"
          size="lg"
          // Keep the round button from stretching to the (wider) sidebar width.
          alignSelf="center"
          icon={<BiQuestionMark />}
          borderRadius="full"
          aria-label="Help"
          data-dd-action-name="create_builder.drawer_tab.help"
          onClick={(e) => {
            e.preventDefault()
            window.open(FORM_GUIDE)
          }}
        />
      </Tooltip>
    </Stack>
  )
}

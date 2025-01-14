import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiGitMerge, BiQuestionMark } from 'react-icons/bi'
import { Divider, Stack } from '@chakra-ui/react'

import { FormResponseMode, SeenFlags } from '~shared/types'

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
import { FEATURE_TOUR } from '../../featureTour/constants'

import { DrawerTabIcon } from './DrawerTabIcon'

export const CreatePageSidebar = (): JSX.Element | null => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

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

  return (
    <Stack
      bg="white"
      pos="sticky"
      top={0}
      px="0.5rem"
      py="1rem"
      borderRight="1px solid"
      borderColor="neutral.300"
      direction="column"
      justifyContent="space-between"
    >
      <Stack spacing="0.5rem">
        <DrawerTabIcon
          label={t('features.adminForm.sidebar.fields.builder.addFields')}
          trackingLabel="create_builder.drawer_tab.add_fields"
          icon={<BxsWidget fontSize="1.5rem" />}
          onClick={handleDrawerBuilderClick}
          isActive={activeTab === DrawerTabs.Builder}
          id={FEATURE_TOUR[0].id}
        />
        <DrawerTabIcon
          label={t('features.adminForm.sidebar.headerAndInstructions.title')}
          trackingLabel="create_builder.drawer_tab.edit_header"
          icon={<BxsDockTop fontSize="1.5rem" />}
          onClick={handleDrawerDesignClick}
          isActive={activeTab === DrawerTabs.Design}
          id={FEATURE_TOUR[1].id}
        />
        <DrawerTabIcon
          label={t('features.adminForm.sidebar.logic.addLogicBtn')}
          trackingLabel="create_builder.drawer_tab.add_logic"
          icon={<BiGitMerge fontSize="1.5rem" />}
          onClick={handleDrawerLogicClick}
          isActive={activeTab === DrawerTabs.Logic}
          id={FEATURE_TOUR[2].id}
        />
        <DrawerTabIcon
          label={t('features.adminForm.sidebar.thankYou.thankYouPage.title')}
          trackingLabel="create_builder.drawer_tab.edit_thank_you_page"
          icon={<PhHandsClapping fontSize="1.5rem" />}
          onClick={handleDrawerEndpageClick}
          isActive={activeTab === DrawerTabs.EndPage}
          id={FEATURE_TOUR[3].id}
        />
        {data?.responseMode === FormResponseMode.Multirespondent && (
          <>
            <Divider />
            <DrawerTabIcon
              label="Add workflow"
              trackingLabel="create_builder.drawer_tab.add_workflow"
              icon={<MultiParty fontSize="1.5rem" />}
              onClick={handleDrawerWorkflowClick}
              isActive={activeTab === DrawerTabs.Workflow}
              showRedDot={shouldShowMrfWorkflowReddot}
            />
          </>
        )}
      </Stack>
      <Tooltip label="Help" placement="right">
        <IconButton
          variant="solid"
          colorScheme="subtle"
          size="lg"
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

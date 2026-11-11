import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import {
  Box,
  Divider,
  Stack,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react'

import {
  FormAuthType,
  FormWorkflowStepAuth,
  FormWorkflowStepBase,
  FormWorkflowStepWriteDto,
  WorkflowType,
} from 'formsg-shared/types'
import { getAuthEsrvcId } from 'formsg-shared/utils/step-login'

import InlineMessage from '~components/InlineMessage'
import { Tab } from '~components/Tabs'

import { useRegisterNavigationSave } from '~features/admin-form/common/navigationSave'
import { adminFormKeys } from '~features/admin-form/common/queries'
import { SaveActionGroup } from '~features/admin-form/create/logic/components/LogicContent/EditLogicBlock/EditCondition'
import { saveStepOneLoginRestrictions } from '~features/admin-form/settings/components/AuthSettingsSection/StepOneLoginRestrictions'
import { adminFormSettingsKeys } from '~features/admin-form/settings/queries'
import { isValidEsrvcId } from '~features/admin-form/settings/utils'
import { useUser } from '~features/user/queries'

import {
  cancelPendingSwitchSelector,
  completeSaveSelector,
  isCreatingStateSelector,
  isGuidedSetupSelector,
  pendingSwitchToSelector,
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useGuidedStepReveal } from '../../../hooks/useGuidedStepReveal'
import { useIsStepLoginShown } from '../../../hooks/useIsStepLoginShown'
import { useWorkflowSurfaces } from '../../../hooks/useWorkflowSurfaces'
import { EditStepInputs } from '../../../types'
import { getGuidedSecondaryAction } from '../../../utils/guidedStepPolicy'
import {
  normaliseFirstStepLogin,
  normaliseStepAuth,
} from '../../../workflow.utils'
import { SpotlightGroup } from '../../Spotlight'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { ApprovalsBlock } from './ApprovalsBlock'
import { GuidedActionGroup } from './GuidedActionGroup'
import { LoginBlock } from './LoginBlock'
import { QuestionsBlock } from './QuestionsBlock'
import { RespondentBlock } from './RespondentBlock'
import { StepNameBlock } from './StepNameBlock'

export interface EditLogicBlockProps {
  defaultValues?: Partial<EditStepInputs>
  onSubmit: (
    inputs: FormWorkflowStepWriteDto,
    afterSave?: () => Promise<void>,
  ) => void | Promise<void>

  stepNumber: number
  submitButtonLabel: string
  handleOpenDeleteModal?: () => void
  isLoading: boolean
}

export const FIELDS_TO_EDIT_NAME = 'edit'
export const APPROVAL_FIELD_NAME = 'approval_field'
export const APPROVAL_ENABLED_NAME = 'is_approval_enabled'

const SECTION_REVEAL_SCROLL_DELAY_MS = 100
const STEP_TABS_KEY = 'features.adminForm.sidebar.workflow.stepLogin.tabs'
const WRAPPING_TAB_PROPS = { _notFirst: { ml: 0 }, _notLast: { mr: 0 } }
const SAVE_ERRORS_KEY =
  'features.adminForm.sidebar.workflow.stepLogin.saveErrors'

type WriteStep = FormWorkflowStepWriteDto & { _id: string }

export const buildWorkflowStep = (
  rawInputs: EditStepInputs,
  isFirstStep: boolean,
): WriteStep | undefined => {
  const inputs = { ...rawInputs }
  if (inputs.approval_field === '') {
    inputs.approval_field = undefined
  }
  if (inputs.step_name === '') {
    inputs.step_name = undefined
  }

  const fieldDeletion = {
    ...(inputs.expected_last_modified
      ? { expected_last_modified: inputs.expected_last_modified }
      : {}),
    ...(inputs.delete_auth_field_ids?.length
      ? { delete_auth_field_ids: inputs.delete_auth_field_ids }
      : {}),
  }

  // Step 1 is always "anyone with the link", represented as a static step with
  // no emails. Legacy forms (pre #7794) may still store step 1 as dynamic with
  // a `field` that can point at a deleted email field, which the backend
  // rejects on save — so saving always rewrites step 1 to static, lazily
  // migrating those forms. Nothing reads step 1's `field` at runtime; step-1
  // notifications come from `stepOneEmailNotificationFieldId`.
  if (isFirstStep) {
    return {
      _id: inputs._id,
      ...fieldDeletion,
      workflow_type: WorkflowType.Static,
      edit: inputs.edit,
      approval_field: inputs.approval_field,
      is_approval_enabled: !!inputs.is_approval_enabled,
      step_name: inputs.step_name,
      emails: inputs.emails ?? [],
      // Only sent once the admin changed Step 1's login in the editor.
      ...normaliseFirstStepLogin(inputs.first_step_login),
    }
  }

  // A saved login is always sent back, even while the login block is hidden,
  // so a save never drops it.
  const workflowStepBase: Omit<FormWorkflowStepBase, 'auth'> & {
    _id: string
    auth: FormWorkflowStepAuth | null
  } = {
    _id: inputs._id,
    ...fieldDeletion,
    workflow_type: inputs.workflow_type,
    edit: inputs.edit,
    approval_field: inputs.approval_field,
    is_approval_enabled: !!inputs.is_approval_enabled,
    step_name: inputs.step_name,
    auth: normaliseStepAuth(inputs.auth),
  }

  const workflowType: WorkflowType | undefined = inputs.workflow_type
  if (!workflowType) {
    return {
      ...workflowStepBase,
      workflow_type: WorkflowType.Static,
      emails: inputs.emails ?? [],
    }
  }

  switch (workflowType) {
    case WorkflowType.Static: {
      return {
        ...workflowStepBase,
        workflow_type: WorkflowType.Static,
        emails: inputs.emails ?? [],
      }
    }
    case WorkflowType.Dynamic: {
      return {
        ...workflowStepBase,
        workflow_type: WorkflowType.Dynamic,
        ...(inputs.field ? { field: inputs.field } : {}),
      } as WriteStep
    }
    case WorkflowType.Conditional: {
      return {
        ...workflowStepBase,
        workflow_type: WorkflowType.Conditional,
        ...(inputs.conditional_field
          ? { conditional_field: inputs.conditional_field }
          : {}),
      } as WriteStep
    }
    default: {
      const exhaustiveCheck: never = workflowType
      return exhaustiveCheck
    }
  }
}

export const EditStepBlock = ({
  stepNumber,
  onSubmit,
  defaultValues,
  isLoading,
  submitButtonLabel,
  handleOpenDeleteModal,
}: EditLogicBlockProps) => {
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const pendingSwitchTo = useAdminWorkflowStore(pendingSwitchToSelector)
  const completeSave = useAdminWorkflowStore(completeSaveSelector)
  const cancelPendingSwitch = useAdminWorkflowStore(cancelPendingSwitchSelector)
  const isCreatingState = useAdminWorkflowStore(isCreatingStateSelector)
  const isGuidedSetup = useAdminWorkflowStore(isGuidedSetupSelector)
  const isLoginShown = useIsStepLoginShown(stepNumber)
  const { t } = useTranslation()
  const { cardRadius, activeCardBg, activeCardBorderWidth, activeCardShadow } =
    useWorkflowSurfaces()

  const formMethods = useForm<EditStepInputs>({
    defaultValues: {
      ...defaultValues,
      is_approval_enabled:
        defaultValues?.is_approval_enabled ?? !!defaultValues?.approval_field,
    },
  })
  const { user, isLoading: isUserLoading } = useUser()
  const [isSavingRestrictions, setIsSavingRestrictions] = useState(false)
  const [saveError, setSaveError] = useState('')
  const { formId } = useParams()
  const queryClient = useQueryClient()
  const _isLoading = isLoading || isUserLoading || isSavingRestrictions

  // StepLoginControls shows the e-service ID error. These rules stop the save.
  const { register } = formMethods
  useEffect(() => {
    if (!isLoginShown) return
    register('auth', {
      validate: (auth) => isValidEsrvcId(getAuthEsrvcId(auth) ?? ''),
    })
    register('first_step_login', {
      validate: (login) => isValidEsrvcId(login?.esrvc_id ?? ''),
    })
  }, [register, isLoginShown])

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [])

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  const { isDirty } = formMethods.formState

  const [activeTab, setActiveTab] = useState(0)
  useEffect(() => setActiveTab(0), [stepNumber])

  const saveSucceeded = useRef(false)
  const pendingNavigationSave = useRef<Promise<boolean> | null>(null)

  const handleSubmit = formMethods.handleSubmit(
    async (inputs: EditStepInputs) => {
      if (inputs.first_step_restrictions_parsing) {
        setSaveError(t(`${SAVE_ERRORS_KEY}.restrictionsParsing`))
        cancelPendingSwitch()
        return
      }
      const step = buildWorkflowStep(inputs, isFirstStep)
      if (!step) {
        cancelPendingSwitch()
        return
      }
      setSaveError('')
      let didSaveStep = false
      try {
        await onSubmit(step, async () => {
          didSaveStep = true
          if (
            !isFirstStep ||
            !inputs.first_step_restrictions ||
            !formId ||
            inputs.first_step_login?.auth_type === FormAuthType.NIL
          )
            return
          setIsSavingRestrictions(true)
          await saveStepOneLoginRestrictions(
            formId,
            {
              isSingleSubmission:
                inputs.first_step_restrictions.baselineIsSingleSubmission,
            },
            inputs.first_step_restrictions.value,
          )
        })
        saveSucceeded.current = true
      } catch (error) {
        cancelPendingSwitch()
        setSaveError(
          didSaveStep
            ? t(`${SAVE_ERRORS_KEY}.restrictionsFailed`)
            : error instanceof Error
              ? error.message
              : t(`${SAVE_ERRORS_KEY}.stepFailed`),
        )
      } finally {
        setIsSavingRestrictions(false)
        if (formId && inputs.first_step_restrictions) {
          void queryClient.invalidateQueries(adminFormKeys.id(formId))
          void queryClient.invalidateQueries(adminFormSettingsKeys.id(formId))
        }
      }
    },
    (errors) => {
      if (errors.approval_field || errors.is_approval_enabled) setActiveTab(1)
      // Step 1 has no Approvals tab, so its Login tab comes second.
      else if (errors.auth || errors.first_step_login)
        setActiveTab(isFirstStep ? 1 : 2)
      else setActiveTab(0)
      cancelPendingSwitch()
    },
  )

  const saveForNavigation = (): Promise<boolean> => {
    if (pendingNavigationSave.current) return pendingNavigationSave.current
    if (_isLoading) return Promise.resolve(false)
    saveSucceeded.current = false
    pendingNavigationSave.current = handleSubmit()
      .then(() => saveSucceeded.current)
      .finally(() => {
        pendingNavigationSave.current = null
      })
    return pendingNavigationSave.current
  }

  useRegisterNavigationSave({
    enabled: isLoginShown,
    isDirty,
    isSaving: _isLoading,
    save: saveForNavigation,
  })

  const hasSubmittedForPendingSwitch = useRef(false)

  const isGuided = isCreatingState && isGuidedSetup

  const questionsSection = (
    <QuestionsBlock
      key="fields"
      formMethods={formMethods}
      isLoading={_isLoading}
      stepNumber={stepNumber}
    />
  )
  const loginSection = isLoginShown ? (
    <LoginBlock
      key="login"
      formMethods={formMethods}
      stepNumber={stepNumber}
      isLoading={_isLoading}
    />
  ) : null
  const approvalsSection = isFirstStep ? null : (
    <ApprovalsBlock
      key="what-they-do"
      formMethods={formMethods}
      stepNumber={stepNumber}
    />
  )

  const useProposedTabs = isLoginShown && !isGuided
  const tabbedSections = (
    <Tabs key="step-settings" index={activeTab} onChange={setActiveTab}>
      <Box px={{ base: '1.5rem', md: '2rem' }}>
        <TabList
          mx="-0.25rem"
          w="100%"
          overflowX="visible"
          flexWrap="wrap"
          columnGap="1.5rem"
          rowGap="0.25rem"
        >
          <Tab {...WRAPPING_TAB_PROPS}>{t(`${STEP_TABS_KEY}.fields`)}</Tab>
          {!isFirstStep && (
            <Tab {...WRAPPING_TAB_PROPS}>{t(`${STEP_TABS_KEY}.approvals`)}</Tab>
          )}
          <Tab {...WRAPPING_TAB_PROPS}>{t(`${STEP_TABS_KEY}.login`)}</Tab>
        </TabList>
        <Divider w="auto" mx={{ base: '-1.5rem', md: '-2rem' }} />
      </Box>
      <TabPanels>
        <TabPanel px="0" pt="1.5rem">
          {questionsSection}
        </TabPanel>
        {!isFirstStep && (
          <TabPanel px="0" pt="1.5rem">
            {approvalsSection}
          </TabPanel>
        )}
        <TabPanel px="0" pt="1.5rem">
          {loginSection}
        </TabPanel>
      </TabPanels>
    </Tabs>
  )

  const sections: JSX.Element[] = [
    <StepNameBlock
      key="name"
      formMethods={formMethods}
      stepNumber={stepNumber}
    />,
    <RespondentBlock
      key="people"
      user={user}
      stepNumber={stepNumber}
      formMethods={formMethods}
      isLoading={_isLoading}
    />,
    // Login follows the respondent: who fills the step, then how they log in,
    // then what they do.
    ...(useProposedTabs
      ? [tabbedSections]
      : [loginSection, approvalsSection, questionsSection]
    ).filter((section): section is JSX.Element => section !== null),
  ]

  const reveal = useGuidedStepReveal({
    sectionCount: sections.length,
    isEnabled: isGuided,
  })

  const { visibleCount } = reveal

  useEffect(() => {
    if (pendingSwitchTo === null) {
      hasSubmittedForPendingSwitch.current = false
      return
    }

    if (isLoading || hasSubmittedForPendingSwitch.current) return

    if (isGuided && !reveal.isOnLastSection) {
      cancelPendingSwitch()
      return
    }

    if (!isCreatingState && !isDirty) {
      completeSave()
      return
    }

    hasSubmittedForPendingSwitch.current = true
    void saveForNavigation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSwitchTo])

  useEffect(() => {
    if (!isGuided || visibleCount <= 1) return
    const timeout = setTimeout(() => {
      wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, SECTION_REVEAL_SCROLL_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [isGuided, visibleCount])

  return (
    <Stack
      ref={wrapperRef}
      spacing="0"
      pt="0.5rem"
      pb="2rem"
      borderRadius={cardRadius}
      bg={isGuided ? 'white' : activeCardBg}
      border={isGuided ? '1px solid' : `${activeCardBorderWidth} solid`}
      borderColor={isGuided ? 'neutral.300' : 'primary.500'}
      boxShadow={isGuided ? 'none' : activeCardShadow}
      transitionProperty="common"
      transitionDuration="normal"
    >
      {useProposedTabs ? (
        <Stack spacing="1.5rem" pt="1.5rem">
          {sections
            .slice(0, -1)
            .flatMap((section, index) =>
              index === 0
                ? [section]
                : [<Divider key={`intro-divider-${index}`} />, section],
            )}
          {tabbedSections}
          <Divider />
        </Stack>
      ) : (
        <SpotlightGroup activeIndex={reveal.activeIndex} isEnabled={isGuided}>
          {sections.slice(0, visibleCount)}
        </SpotlightGroup>
      )}
      {saveError && isLoginShown ? (
        <Box px="2rem" pt="1rem">
          <InlineMessage variant="error">{saveError}</InlineMessage>
        </Box>
      ) : null}
      <Box pt="1.5rem">
        {isGuided ? (
          <GuidedActionGroup
            secondaryAction={getGuidedSecondaryAction({
              sectionIndex: visibleCount - 1,
              canCancel: !isFirstStep,
            })}
            isOnLastSection={reveal.isOnLastSection}
            isLoading={_isLoading}
            onBack={reveal.goBack}
            onCancel={setToInactive}
            onContinue={reveal.advance}
            onDone={() => void saveForNavigation()}
          />
        ) : (
          <SaveActionGroup
            isLoading={_isLoading}
            handleSubmit={() => void saveForNavigation()}
            handleDelete={handleOpenDeleteModal}
            handleCancel={setToInactive}
            submitButtonLabel={submitButtonLabel}
            ariaLabelName="step"
          />
        )}
      </Box>
    </Stack>
  )
}

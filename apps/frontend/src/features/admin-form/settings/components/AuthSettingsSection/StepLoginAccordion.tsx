import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiArrowUpRight } from 'react-icons/fi'
import { useIsMutating } from 'react-query'
import { useNavigate, useParams } from 'react-router'
import { Box, Stack, Text } from '@chakra-ui/react'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  FormSettings,
  MultirespondentFormSettings,
} from 'formsg-shared/types'

import { ADMINFORM_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import Link from '~components/Link'

import {
  saveBeforeNavigation,
  useRegisterNavigationSave,
} from '~features/admin-form/common/navigationSave'
import { NavigationSaveGuard } from '~features/admin-form/common/NavigationSaveGuard'
import { OPEN_WORKFLOW_TAB_STATE } from '~features/admin-form/create/common/OpenWorkflowTabOnArrival'
import { StepLabel } from '~features/admin-form/create/workflow/components/WorkflowContent/StepLabel'
import { WorkflowStepBlockDivider } from '~features/admin-form/create/workflow/components/WorkflowContent/WorkflowStepBlockDivider'
import { useWorkflowSurfaces } from '~features/admin-form/create/workflow/hooks/useWorkflowSurfaces'

import {
  StepAuthSettingsEditor,
  StepLoginDraft,
} from './StepAuthSettingsEditor'

interface StepLoginAccordionProps {
  form: AdminMultirespondentFormDto
  settings: FormSettings
}
const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin.settings'

/** Always-editable workflow login cards share one save/navigation owner. */
export const StepLoginAccordion = ({
  form,
  settings,
}: StepLoginAccordionProps): JSX.Element => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const navigate = useNavigate()
  const { cardRadius } = useWorkflowSurfaces()
  const [savingControl, setSavingControl] = useState<'esrvcId' | 'other'>()
  const [queuedProvider, setQueuedProvider] = useState<{
    stepId: string
    authType: FormAuthType
  }>()

  const saveLock = useRef(false)
  const [workflowRequested, setWorkflowRequested] = useState(false)
  const otherMutations = useIsMutating()
  const [drafts, setDrafts] = useState<Record<string, StepLoginDraft>>({})
  const draftsRef = useRef(drafts)
  const registerDraft = useCallback(
    (id: string, draft: StepLoginDraft | null) => {
      const next = { ...draftsRef.current }
      if (draft) next[id] = draft
      else delete next[id]
      draftsRef.current = next
      setDrafts(next)
    },
    [],
  )
  const runSave = useCallback(
    async (id: string, action: () => Promise<void>, isEsrvcIdSave = false) => {
      if (
        saveLock.current ||
        Object.entries(draftsRef.current).some(
          ([key, draft]) => key !== id && draft.pending,
        )
      )
        return false
      saveLock.current = true
      setSavingControl(isEsrvcIdSave ? 'esrvcId' : 'other')
      try {
        await action()
        return true
      } catch {
        setQueuedProvider(undefined)
        setWorkflowRequested(false)
        return false
      } finally {
        saveLock.current = false
        setSavingControl(undefined)
      }
    },
    [],
  )
  const busy = savingControl !== undefined || otherMutations > 0
  // Blurring the ID can start a save before the provider label receives its click.
  // Apply that choice against the refreshed version, including field consequences.
  useEffect(() => {
    if (busy || !queuedProvider) return
    setQueuedProvider(undefined)
    draftsRef.current[queuedProvider.stepId]?.selectProvider(
      queuedProvider.authType,
    )
  }, [busy, queuedProvider])

  useRegisterNavigationSave({
    isDirty: Object.values(drafts).some((draft) => draft.dirty),
    isSaving: busy,
    save: async () => {
      for (const draft of Object.values(draftsRef.current)) {
        if (draft.dirty && !(await draft.save())) return false
      }
      return true
    },
  })
  const goToWorkflow = () => setWorkflowRequested(true)
  useEffect(() => {
    if (!workflowRequested || busy) return
    setWorkflowRequested(false)
    void saveBeforeNavigation().then((saved) => {
      if (saved)
        navigate(`${ADMINFORM_ROUTE}/${formId}`, {
          state: OPEN_WORKFLOW_TAB_STATE,
        })
    })
  }, [workflowRequested, busy, navigate, formId])

  return (
    <Stack spacing="2rem">
      <NavigationSaveGuard />
      <Text textStyle="body-1">
        {t(`${COPY_KEY}.description`)}{' '}
        <Link as="button" type="button" onClick={goToWorkflow}>
          {t(`${COPY_KEY}.editWorkflow`)}
        </Link>
      </Text>
      <Box>
        {form.workflow.map((step, stepIndex) => {
          const disabled =
            busy ||
            Object.entries(drafts).some(
              ([id, draft]) => id !== step._id && draft.pending,
            )
          return (
            <Fragment key={step._id}>
              {stepIndex > 0 ? (
                <WorkflowStepBlockDivider testId="settings-step-connector" />
              ) : null}
              <Box
                as="section"
                aria-label={
                  step.step_name ||
                  `${t('features.common.entities.step')} ${stepIndex + 1}`
                }
                border="1px solid"
                borderColor="secondary.200"
                borderRadius={cardRadius}
                bg="white"
                overflow="hidden"
              >
                <Box p="2rem">
                  <StepLabel stepNumber={stepIndex} stepName={step.step_name} />
                </Box>
                <StepAuthSettingsEditor
                  form={form}
                  settings={settings as MultirespondentFormSettings}
                  step={step}
                  stepIndex={stepIndex}
                  isDisabled={disabled}
                  onQueueProvider={
                    savingControl === 'esrvcId' && !queuedProvider
                      ? (authType) =>
                          setQueuedProvider({ stepId: step._id, authType })
                      : undefined
                  }
                  registerDraft={registerDraft}
                  runSave={runSave}
                />
              </Box>
            </Fragment>
          )
        })}
        <WorkflowStepBlockDivider testId="settings-add-step-connector" />
        <Button
          w="100%"
          variant="outline"
          rightIcon={<FiArrowUpRight aria-hidden />}
          onClick={goToWorkflow}
        >
          {t(`${COPY_KEY}.addStep`)}
        </Button>
      </Box>
    </Stack>
  )
}

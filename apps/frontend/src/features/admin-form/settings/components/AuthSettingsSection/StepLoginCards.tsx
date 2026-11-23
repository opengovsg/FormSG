import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiArrowUpRight } from 'react-icons/fi'
import { useIsMutating } from 'react-query'
import { useNavigate, useParams } from 'react-router'
import { Box, Stack, Text } from '@chakra-ui/react'

import {
  AdminMultirespondentFormDto,
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

interface StepLoginCardsProps {
  form: AdminMultirespondentFormDto
  settings: MultirespondentFormSettings
}
const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin.settings'

export const StepLoginCards = ({
  form,
  settings,
}: StepLoginCardsProps): JSX.Element => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const navigate = useNavigate()
  const { cardRadius } = useWorkflowSurfaces()
  const [isSaving, setIsSaving] = useState(false)
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
    async (id: string, action: () => Promise<void>) => {
      if (
        saveLock.current ||
        Object.entries(draftsRef.current).some(
          ([key, draft]) => key !== id && draft.pending,
        )
      )
        return false
      saveLock.current = true
      setIsSaving(true)
      try {
        await action()
        return true
      } catch {
        setWorkflowRequested(false)
        return false
      } finally {
        saveLock.current = false
        setIsSaving(false)
      }
    },
    [],
  )
  const busy = isSaving || otherMutations > 0
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
                borderColor="neutral.300"
                borderRadius={cardRadius}
                bg="white"
                overflow="hidden"
              >
                <Box p="2rem">
                  <StepLabel stepNumber={stepIndex} stepName={step.step_name} />
                </Box>
                <Box
                  as="fieldset"
                  disabled={disabled}
                  border="0"
                  m="0"
                  p="0"
                  minW="0"
                >
                  <StepAuthSettingsEditor
                    form={form}
                    settings={settings}
                    step={step}
                    stepIndex={stepIndex}
                    isDisabled={disabled}
                    registerDraft={registerDraft}
                    runSave={runSave}
                  />
                </Box>
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

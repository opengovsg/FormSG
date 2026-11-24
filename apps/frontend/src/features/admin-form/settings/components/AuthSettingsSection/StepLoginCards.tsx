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
import { getWorkflowStepLabel } from '~features/admin-form/create/workflow/utils/getWorkflowStepLabel'

import {
  StepAuthSettingsEditor,
  StepLoginDraft,
} from './StepAuthSettingsEditor'

interface StepLoginCardsProps {
  form: AdminMultirespondentFormDto
  settings: MultirespondentFormSettings
}
const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin.settings'

const isAnotherDraftPending = (
  drafts: Record<string, StepLoginDraft>,
  id: string,
) => Object.entries(drafts).some(([key, draft]) => key !== id && draft.pending)

export const StepLoginCards = ({
  form,
  settings,
}: StepLoginCardsProps): JSX.Element => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const navigate = useNavigate()
  const { cardRadius } = useWorkflowSurfaces()
  const [savingControl, setSavingControl] = useState<'esrvcId' | 'other'>()
  const [settledSaves, setSettledSaves] = useState(0)
  const [hasQueuedClick, setHasQueuedClick] = useState(false)
  const inFlightSave = useRef<Promise<boolean> | null>(null)
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
      if (inFlightSave.current || isAnotherDraftPending(draftsRef.current, id))
        return false
      setSavingControl(isEsrvcIdSave ? 'esrvcId' : 'other')
      const save = action().then(
        () => true,
        () => false,
      )
      inFlightSave.current = save
      try {
        return await save
      } finally {
        inFlightSave.current = null
        setSavingControl(undefined)
        setSettledSaves((count) => count + 1)
      }
    },
    [],
  )
  const busy = savingControl !== undefined || otherMutations > 0
  const isBusy = useRef(busy)
  isBusy.current = busy
  const idleWaiters = useRef<(() => void)[]>([])
  useEffect(() => {
    if (busy) return
    idleWaiters.current.splice(0).forEach((resume) => resume())
  }, [busy, settledSaves])
  const waitUntilSavesSettle = useCallback(
    () =>
      isBusy.current || inFlightSave.current
        ? new Promise<void>((resolve) => idleWaiters.current.push(resolve))
        : Promise.resolve(),
    [],
  )
  const queueClick = useCallback(
    (run: () => void) => {
      setHasQueuedClick(true)
      void waitUntilSavesSettle().then(() => {
        setHasQueuedClick(false)
        run()
      })
    },
    [waitUntilSavesSettle],
  )

  useRegisterNavigationSave({
    isDirty:
      busy ||
      hasQueuedClick ||
      Object.values(drafts).some((draft) => draft.dirty),
    save: async () => {
      const pending = inFlightSave.current
      await waitUntilSavesSettle()
      if (pending && !(await pending)) return false
      for (const draft of Object.values(draftsRef.current)) {
        if (draft.dirty && !(await draft.save())) return false
      }
      return true
    },
  })
  const goToWorkflow = () =>
    void saveBeforeNavigation().then((saved) => {
      if (saved)
        navigate(`${ADMINFORM_ROUTE}/${formId}`, {
          state: OPEN_WORKFLOW_TAB_STATE,
        })
    })

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
          const disabled = busy || isAnotherDraftPending(drafts, step._id)
          return (
            <Fragment key={step._id}>
              {stepIndex > 0 ? (
                <WorkflowStepBlockDivider testId="settings-step-connector" />
              ) : null}
              <Box
                as="section"
                aria-label={getWorkflowStepLabel({
                  stepNumber: stepIndex,
                  stepName: step.step_name,
                  stepWord: t('features.common.entities.step'),
                })}
                border="1px solid"
                borderColor="neutral.300"
                borderRadius={cardRadius}
                bg="white"
                overflow="hidden"
              >
                <Box p="2rem">
                  <StepLabel stepNumber={stepIndex} stepName={step.step_name} />
                </Box>
                <StepAuthSettingsEditor
                  form={form}
                  settings={settings}
                  step={step}
                  stepIndex={stepIndex}
                  isDisabled={disabled}
                  queueAfterSave={
                    savingControl === 'esrvcId' && !hasQueuedClick
                      ? queueClick
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

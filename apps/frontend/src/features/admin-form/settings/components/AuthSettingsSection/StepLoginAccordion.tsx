import { Fragment, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiPencil } from 'react-icons/bi'
import { useNavigate, useParams } from 'react-router'
import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Icon,
  Stack,
  Text,
} from '@chakra-ui/react'

import {
  AdminMultirespondentFormDto,
  FormSettings,
  MultirespondentFormSettings,
} from 'formsg-shared/types'
import {
  getStepAuthType,
  isWorkflowStepAuthType,
} from 'formsg-shared/utils/step-login'

import { ADMINFORM_ROUTE } from '~constants/routes'
import Link from '~components/Link'

import {
  saveBeforeNavigation,
  useRegisterNavigationSave,
} from '~features/admin-form/common/navigationSave'
import { NavigationSaveGuard } from '~features/admin-form/common/NavigationSaveGuard'
import { OPEN_WORKFLOW_TAB_STATE } from '~features/admin-form/create/common/OpenWorkflowTabOnArrival'
import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'
import { StepLabel } from '~features/admin-form/create/workflow/components/WorkflowContent/StepLabel'
import { WorkflowStepBlockDivider } from '~features/admin-form/create/workflow/components/WorkflowContent/WorkflowStepBlockDivider'
import { useWorkflowSurfaces } from '~features/admin-form/create/workflow/hooks/useWorkflowSurfaces'
import { STEP_LOGIN_LABEL_KEYS } from '~features/admin-form/create/workflow/utils/stepLoginAvailability'

import { StepAuthSettingsEditor } from './StepAuthSettingsEditor'

interface StepLoginAccordionProps {
  form: AdminMultirespondentFormDto
  settings: FormSettings
}

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin.settings'

/** Familiar workflow cards, focused on authentication. All start collapsed. */
export const StepLoginAccordion = ({
  form,
  settings,
}: StepLoginAccordionProps): JSX.Element => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const navigate = useNavigate()
  const { cardRadius, activeCardBg } = useWorkflowSurfaces()
  const [openIndex, setOpenIndex] = useState(-1)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const saveRef = useRef<(() => Promise<boolean>) | null>(null)
  const registerSave = useCallback((save: (() => Promise<boolean>) | null) => {
    saveRef.current = save
  }, [])
  useRegisterNavigationSave({
    isDirty,
    isSaving,
    save: () => saveRef.current?.() ?? Promise.resolve(false),
  })
  const applyChange = (index: number) => {
    setIsDirty(false)
    if (index === -2)
      navigate(`${ADMINFORM_ROUTE}/${formId}`, {
        state: OPEN_WORKFLOW_TAB_STATE,
      })
    else setOpenIndex(index)
  }
  const requestChange = (index: number) => {
    if (isSaving) return
    void saveBeforeNavigation().then((saved) => {
      if (saved) applyChange(index)
    })
  }

  return (
    <Stack spacing="2rem">
      <NavigationSaveGuard />
      <Box>
        <Text textStyle="body-1">
          {t(`${COPY_KEY}.description`)}{' '}
          <Link as="button" type="button" onClick={() => requestChange(-2)}>
            {t(`${COPY_KEY}.editWorkflow`)}
          </Link>
        </Text>
      </Box>
      <Accordion
        allowToggle
        reduceMotion
        index={openIndex}
        onChange={(index) => requestChange(index as number)}
      >
        {form.workflow.map((step, stepIndex) => {
          const authType = getStepAuthType(settings, form.workflow, stepIndex)
          const label = isWorkflowStepAuthType(authType)
            ? t(STEP_LOGIN_LABEL_KEYS[authType])
            : undefined
          return (
            <Fragment key={step._id}>
              {stepIndex > 0 ? (
                <WorkflowStepBlockDivider testId="settings-step-connector" />
              ) : null}
              <AccordionItem
                border="1px solid"
                borderColor={
                  openIndex === stepIndex ? 'primary.500' : 'neutral.300'
                }
                borderRadius={cardRadius}
                bg={openIndex === stepIndex ? activeCardBg : 'white'}
                overflow="hidden"
              >
                {({ isExpanded }) => (
                  <>
                    <AccordionButton
                      p="2rem"
                      position="relative"
                      textAlign="left"
                      disabled={isSaving}
                      // An open card's header would tint down over its
                      // editor, so only a closed card shows the hover.
                      cursor={isExpanded ? 'default' : 'pointer'}
                      _hover={{ bg: isExpanded ? 'transparent' : 'primary.50' }}
                    >
                      <Stack
                        flex="1"
                        spacing="0.5rem"
                        pr={isExpanded ? 0 : '2.5rem'}
                      >
                        <StepLabel
                          stepNumber={stepIndex}
                          stepName={step.step_name}
                        />
                        {!isExpanded ? (
                          <Box pl="4.25rem">
                            {label ? (
                              <LogicBadge>{label}</LogicBadge>
                            ) : (
                              <Text textStyle="body-2" color="secondary.400">
                                {t(`${COPY_KEY}.notEnabled`)}
                              </Text>
                            )}
                          </Box>
                        ) : null}
                      </Stack>
                      {!isExpanded && (
                        <Icon
                          as={BiPencil}
                          aria-hidden
                          pointerEvents="none"
                          position="absolute"
                          top="2rem"
                          right="2rem"
                          color="secondary.300"
                          boxSize="1.5rem"
                        />
                      )}
                    </AccordionButton>
                    <AccordionPanel p="0">
                      {isExpanded ? (
                        <StepAuthSettingsEditor
                          form={form}
                          settings={settings as MultirespondentFormSettings}
                          step={step}
                          stepIndex={stepIndex}
                          onClose={() => setOpenIndex(-1)}
                          onDirtyChange={setIsDirty}
                          onSavingChange={setIsSaving}
                          onSaveReady={registerSave}
                        />
                      ) : null}
                    </AccordionPanel>
                  </>
                )}
              </AccordionItem>
            </Fragment>
          )
        })}
      </Accordion>
    </Stack>
  )
}

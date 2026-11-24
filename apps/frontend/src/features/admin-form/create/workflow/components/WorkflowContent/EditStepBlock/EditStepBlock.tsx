import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FieldErrors, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useParams } from 'react-router'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Divider,
  Stack,
  Text,
  usePrefersReducedMotion,
} from '@chakra-ui/react'

import { FormAuthType, FormWorkflowStepWriteDto } from 'formsg-shared/types'
import { getAuthEsrvcId } from 'formsg-shared/utils/step-login'

import { textStyles } from '~theme/textStyles'
import InlineMessage from '~components/InlineMessage'

import { useRegisterNavigationSave } from '~features/admin-form/common/navigationSave'
import {
  adminFormKeys,
  useAdminForm,
} from '~features/admin-form/common/queries'
import { SaveActionGroup } from '~features/admin-form/create/logic/components/LogicContent/EditLogicBlock/EditCondition'
import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'
import { LOGIN_OPTION_COPY } from '~features/admin-form/settings/components/AuthSettingsSection/constants'
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
import { useGuidedStepNavigation } from '../../../hooks/useGuidedStepNavigation'
import { useIsMrfStepLoginEnabled } from '../../../hooks/useIsMrfStepLoginEnabled'
import { useIsStepLoginShown } from '../../../hooks/useIsStepLoginShown'
import { useWorkflowSurfaces } from '../../../hooks/useWorkflowSurfaces'
import { EditStepInputs } from '../../../types'
import { getGuidedSecondaryAction } from '../../../utils/guidedStepPolicy'
import { isWorkflowEmailValidationError } from '../../../utils/isWorkflowEmailValidationError'
import { Spotlight, SpotlightGroup } from '../../Spotlight'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { ApprovalsBlock } from './ApprovalsBlock'
import { buildWorkflowStep } from './buildWorkflowStep'
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
const SECTION_LABEL_KEYS = {
  fields: 'features.adminForm.sidebar.workflow.questions.accordionLabel',
  login: 'features.adminForm.sidebar.workflow.stepLogin.workflowQuestion',
  approvals: 'features.adminForm.sidebar.workflow.approvals.heading',
} as const
const SAVE_ERRORS_KEY =
  'features.adminForm.sidebar.workflow.stepLogin.saveErrors'

type AccordionSection = 'login' | 'fields' | 'approvals'
type StepSection = 'name' | 'people' | AccordionSection
const isAccordionSection = (
  section: StepSection,
): section is AccordionSection =>
  section === 'login' || section === 'fields' || section === 'approvals'

const SECTION_FIELDS: Record<StepSection, (keyof EditStepInputs)[]> = {
  name: ['step_name'],
  people: ['workflow_type', 'emails', 'field', 'conditional_field'],
  login: ['auth', 'first_step_login'],
  fields: ['edit'],
  approvals: ['approval_field', 'is_approval_enabled'],
}

const INVALID_INPUT_SELECTORS = [
  'input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"]',
  '[aria-invalid="true"][tabindex]',
]
const FALLBACK_INPUT_SELECTORS = [
  'input:not([type="hidden"]):not([type="radio"])',
  '[role="combobox"]',
  'input',
  'button',
]
const findFirst = (root: Element | null | undefined, selectors: string[]) =>
  selectors.reduce<HTMLElement | null>(
    (found, selector) =>
      found ?? root?.querySelector<HTMLElement>(selector) ?? null,
    null,
  )

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
  const {
    cardRadius,
    activeCardBg,
    activeCardBorderWidth,
    activeCardShadow,
    cardHoverBg,
    iconTransitionDuration,
  } = useWorkflowSurfaces()
  const prefersReducedMotion = usePrefersReducedMotion()

  const formMethods = useForm<EditStepInputs>({
    defaultValues: {
      ...defaultValues,
      is_approval_enabled:
        defaultValues?.is_approval_enabled ?? !!defaultValues?.approval_field,
    },
  })
  const { user, isLoading: isUserLoading } = useUser()
  const { data: form } = useAdminForm()
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
  const saveErrorRef = useRef<HTMLDivElement | null>(null)
  const skipNextRevealScroll = useRef(false)

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

  const isGuided = isCreatingState && isGuidedSetup
  const isStepLoginEnabled = useIsMrfStepLoginEnabled()
  const isStackedGuide = isGuided && !isStepLoginEnabled
  const inAccordion = isLoginShown && !isStackedGuide
  const loginSections: AccordionSection[] = isLoginShown ? ['login'] : []
  const approvalSections: AccordionSection[] = isFirstStep ? [] : ['approvals']
  const accordionOrder: AccordionSection[] = [
    'fields',
    ...loginSections,
    ...approvalSections,
  ]
  const sectionOrder: [StepSection, ...StepSection[]] = [
    'name',
    'people',
    ...(inAccordion
      ? accordionOrder
      : [...loginSections, ...approvalSections, 'fields' as const]),
  ]
  const reveal = useGuidedStepNavigation({
    sections: sectionOrder,
    isEnabled: isGuided,
  })
  const { activeSection } = reveal
  const [peopleExpanded, setPeopleExpanded] = useState(true)
  const [expandedSections, setExpandedSections] = useState<AccordionSection[]>(
    () => (isGuided ? [] : ['fields']),
  )
  useEffect(() => {
    if (!isGuided) return
    if (activeSection === 'people') setPeopleExpanded(true)
    if (!isAccordionSection(activeSection)) return
    setExpandedSections((previous) =>
      previous.includes(activeSection)
        ? previous
        : [...previous, activeSection],
    )
  }, [isGuided, activeSection])
  const [focusSection, setFocusSection] = useState<StepSection | null>(null)

  const openSection = (section: StepSection, focus = false) => {
    if (!sectionOrder.includes(section)) return
    const movesAccordionGuide =
      isGuided && inAccordion && section !== activeSection
    if (movesAccordionGuide) reveal.goTo(section)
    if (section === 'people') setPeopleExpanded(true)
    if (isAccordionSection(section)) {
      setExpandedSections((previous) =>
        previous.includes(section) ? previous : [...previous, section],
      )
    }
    if (focus) {
      skipNextRevealScroll.current = movesAccordionGuide
      setFocusSection(section)
    }
  }

  useEffect(() => {
    if (!focusSection) return
    const frame = requestAnimationFrame(() => {
      const section = wrapperRef.current?.querySelector(
        `[data-step-section="${focusSection}"]`,
      )
      const input =
        findFirst(section, INVALID_INPUT_SELECTORS) ??
        (saveError ? saveErrorRef.current : null) ??
        findFirst(section, FALLBACK_INPUT_SELECTORS)
      input?.focus()
      ;(input ?? section)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
      setFocusSection(null)
    })
    return () => cancelAnimationFrame(frame)
  }, [focusSection, saveError])

  const routeValidationErrors = (errors: FieldErrors<EditStepInputs>) => {
    const section = sectionOrder.find((candidate) =>
      SECTION_FIELDS[candidate].some((name) => errors[name]),
    )
    if (section) openSection(section, true)
  }

  const continueGuidance = async () => {
    if (!inAccordion) return reveal.advance()
    const valid = await formMethods.trigger(SECTION_FIELDS[activeSection])
    if (!valid) {
      openSection(activeSection, true)
      return
    }
    if (
      activeSection === 'login' &&
      formMethods.getValues('first_step_restrictions_parsing')
    ) {
      setSaveError(t(`${SAVE_ERRORS_KEY}.restrictionsParsing`))
      return
    }
    setSaveError('')
    reveal.advance()
  }

  const saveSucceeded = useRef(false)
  const pendingNavigationSave = useRef<Promise<boolean> | null>(null)

  const handleSubmit = formMethods.handleSubmit(
    async (inputs: EditStepInputs) => {
      if (inputs.first_step_restrictions_parsing) {
        setSaveError(t(`${SAVE_ERRORS_KEY}.restrictionsParsing`))
        openSection('login', true)
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
        if (!didSaveStep && isWorkflowEmailValidationError(error)) {
          formMethods.setError('emails', {
            type: 'server',
            message: t(
              'features.adminForm.sidebar.workflow.staticRespondent.invalidEmails',
            ),
          })
          openSection('people', true)
          setSaveError('')
          return
        }
        if (didSaveStep) openSection('login', true)
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
      routeValidationErrors(errors)
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

  const questionsSection = (
    <QuestionsBlock
      inAccordion={inAccordion}
      formMethods={formMethods}
      isLoading={_isLoading}
      stepNumber={stepNumber}
    />
  )
  const loginSection = isLoginShown ? (
    <LoginBlock
      inAccordion={inAccordion}
      formMethods={formMethods}
      stepNumber={stepNumber}
      isLoading={_isLoading}
    />
  ) : null
  const approvalsSection = isFirstStep ? null : (
    <ApprovalsBlock
      inAccordion={inAccordion}
      formMethods={formMethods}
      stepNumber={stepNumber}
    />
  )

  const accordionSections: Record<AccordionSection, JSX.Element | null> = {
    login: loginSection,
    fields: questionsSection,
    approvals: approvalsSection,
  }

  const assignedFields = formMethods.watch('edit') ?? []
  const editedAuth = formMethods.watch('auth')
  const firstStepLogin = formMethods.watch('first_step_login')
  const authType = isFirstStep
    ? (firstStepLogin?.auth_type ?? form?.authType ?? FormAuthType.NIL)
    : (editedAuth?.auth_type ?? FormAuthType.NIL)
  const approvalEnabled = formMethods.watch('is_approval_enabled')
  const summaries: Record<AccordionSection, string> = {
    fields: t(
      'features.adminForm.sidebar.workflow.stepLogin.summaries.fields',
      {
        count: assignedFields.length,
      },
    ),
    login: t(LOGIN_OPTION_COPY[authType].labelKey),
    approvals: t(
      `features.adminForm.sidebar.workflow.approvals.${approvalEnabled ? 'approver' : 'notApprover'}`,
    ),
  }
  const expandableSections = (
    <Accordion
      allowMultiple
      reduceMotion={prefersReducedMotion}
      index={accordionOrder.flatMap((section, index) =>
        expandedSections.includes(section) &&
        (!isGuided || reveal.isReached(section))
          ? [index]
          : [],
      )}
      onChange={(indexes) => {
        const next = [indexes].flat().map((index) => accordionOrder[index])
        const opened = next.find(
          (section) => !expandedSections.includes(section),
        )
        setExpandedSections(next)
        if (opened) reveal.goTo(opened)
      }}
    >
      {accordionOrder.map((section) => (
        <AccordionItem
          key={section}
          border="0"
          borderTop="1px solid"
          borderColor="neutral.300"
        >
          {({ isExpanded }) => (
            <>
              <AccordionButton
                px={{ base: '1.5rem', md: '2rem' }}
                py="1.5rem"
                textAlign="left"
                columnGap="0.75rem"
                aria-label={t(SECTION_LABEL_KEYS[section])}
                aria-describedby={
                  isExpanded
                    ? undefined
                    : `step-${stepNumber}-${section}-summary`
                }
                aria-disabled={isGuided && !reveal.isReached(section)}
                onClick={(event) => {
                  if (isGuided && !reveal.isReached(section))
                    event.preventDefault()
                }}
                transitionProperty="background-color"
                transitionDuration={iconTransitionDuration}
                _hover={{
                  bg:
                    isGuided && !reveal.isReached(section)
                      ? 'transparent'
                      : cardHoverBg,
                }}
              >
                <Text
                  id={
                    section === 'fields'
                      ? `${FIELDS_TO_EDIT_NAME}-label`
                      : undefined
                  }
                  flex="1"
                  minW="0"
                  style={textStyles.h4}
                >
                  {t(SECTION_LABEL_KEYS[section])}
                </Text>
                {!isExpanded ? (
                  <Box
                    id={`step-${stepNumber}-${section}-summary`}
                    minW="0"
                    maxW="50%"
                  >
                    <LogicBadge bg="white" overflowWrap="anywhere">
                      {summaries[section]}
                    </LogicBadge>
                  </Box>
                ) : null}
                <AccordionIcon flexShrink="0" />
              </AccordionButton>
              <AccordionPanel
                px="0"
                pt="0.25rem"
                pb="1.5rem"
                data-step-section={section}
              >
                <Spotlight
                  isEnabled={isGuided}
                  isActive={activeSection === section}
                >
                  {accordionSections[section]}
                </Spotlight>
              </AccordionPanel>
            </>
          )}
        </AccordionItem>
      ))}
    </Accordion>
  )

  const sections: Record<StepSection, JSX.Element | null> = {
    name: <StepNameBlock formMethods={formMethods} stepNumber={stepNumber} />,
    people: (
      <RespondentBlock
        expanded={peopleExpanded}
        onExpandedChange={setPeopleExpanded}
        inAccordion={inAccordion}
        user={user}
        stepNumber={stepNumber}
        formMethods={formMethods}
        isLoading={_isLoading}
      />
    ),
    ...accordionSections,
  }
  const introductorySections = ['name', 'people'] as const
  const visibleStackedSections = isGuided
    ? sectionOrder.slice(0, sectionOrder.indexOf(activeSection) + 1)
    : sectionOrder

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
    if (skipNextRevealScroll.current) {
      skipNextRevealScroll.current = false
      return
    }
    if (!isGuided || reveal.isFirstSection) return
    const timeout = setTimeout(() => {
      wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, SECTION_REVEAL_SCROLL_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [isGuided, activeSection, reveal.isFirstSection])

  return (
    <Stack
      ref={wrapperRef}
      spacing="0"
      pt="0.5rem"
      pb="2rem"
      borderRadius={cardRadius}
      bg={isGuided ? 'white' : activeCardBg}
      border={isGuided ? '1px solid' : `${activeCardBorderWidth} solid`}
      borderColor={isGuided ? 'secondary.200' : 'primary.500'}
      boxShadow={isGuided ? 'none' : activeCardShadow}
      transitionProperty="common"
      transitionDuration="normal"
    >
      {inAccordion ? (
        <Stack
          spacing={isGuided || !isFirstStep ? '0' : '1.5rem'}
          pt={isGuided ? '0' : '1.5rem'}
        >
          {introductorySections.map((section, index) =>
            !isGuided || reveal.isReached(section) ? (
              <Box key={section} data-step-section={section}>
                {!isGuided && index > 0 ? (
                  <Divider
                    mt={isFirstStep ? 0 : '1.5rem'}
                    mb={isFirstStep ? '1.5rem' : 0}
                  />
                ) : null}
                <Spotlight
                  isEnabled={isGuided}
                  isActive={activeSection === section}
                >
                  {sections[section]}
                </Spotlight>
              </Box>
            ) : null,
          )}
          <Box>
            {!isGuided || reveal.isReached(accordionOrder[0])
              ? expandableSections
              : null}
            <Divider />
          </Box>
        </Stack>
      ) : (
        <SpotlightGroup
          activeIndex={isGuided ? visibleStackedSections.length - 1 : null}
          isEnabled={isGuided}
        >
          {visibleStackedSections.map((section) => (
            <Box key={section} data-step-section={section}>
              {sections[section]}
            </Box>
          ))}
        </SpotlightGroup>
      )}
      {saveError && isLoginShown ? (
        <Box px="2rem" pt="1rem" ref={saveErrorRef} role="alert" tabIndex={-1}>
          <InlineMessage variant="error">{saveError}</InlineMessage>
        </Box>
      ) : null}
      <Box pt="1.5rem">
        {isGuided ? (
          <GuidedActionGroup
            secondaryAction={getGuidedSecondaryAction({
              isFirstSection: reveal.isFirstSection,
              canCancel: !isFirstStep,
            })}
            isOnLastSection={reveal.isOnLastSection}
            isLoading={_isLoading}
            onBack={reveal.goBack}
            onCancel={setToInactive}
            onContinue={() => void continueGuidance()}
            onDone={() => void saveForNavigation()}
            doneLabel={inAccordion ? submitButtonLabel : undefined}
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

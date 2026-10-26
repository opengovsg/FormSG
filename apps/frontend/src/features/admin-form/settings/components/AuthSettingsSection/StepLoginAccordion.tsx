import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Text,
} from '@chakra-ui/react'

import { AdminMultirespondentFormDto, FormSettings } from 'formsg-shared/types'
import {
  getStepAuthType,
  isWorkflowStepAuthType,
  STEP_LOGIN_PROVIDER_LABELS,
} from 'formsg-shared/utils/step-login'

import { LaterStepAuthSettings } from './LaterStepAuthSettings'

const COPY_KEY = 'features.adminForm.settings.singpass.stepLogin'

interface StepLoginAccordionProps {
  form: AdminMultirespondentFormDto
  settings: FormSettings
  // Step 1's controls, which still save to the form-level settings.
  stepOneSettings: ReactNode
}

/**
 * One collapsible section per workflow step, each headed by the step's
 * login, so an admin sees every step's login at a glance.
 */
export const StepLoginAccordion = ({
  form,
  settings,
  stepOneSettings,
}: StepLoginAccordionProps): JSX.Element => {
  const { t } = useTranslation()
  // Settings is the source of truth for Step 1; the form query may lag.
  const loginForm = { authType: settings.authType, esrvcId: settings.esrvcId }

  return (
    <Accordion allowMultiple defaultIndex={[0]}>
      {form.workflow.map((step, stepIndex) => {
        const authType = getStepAuthType(loginForm, form.workflow, stepIndex)
        const login = isWorkflowStepAuthType(authType)
          ? STEP_LOGIN_PROVIDER_LABELS[authType]
          : t('features.adminForm.sidebar.workflow.stepLogin.none')
        // Always "Step N", whatever the admin named the step, so the login
        // list reads the same way the workflow tab numbers its steps.
        const header = t(`${COPY_KEY}.stepHeader`, {
          stepNumber: stepIndex + 1,
          login,
        })

        return (
          <AccordionItem key={step._id}>
            <AccordionButton px="1rem" py="1rem">
              <Text textStyle="subhead-1" flex="1" textAlign="left">
                {header}
              </Text>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel px="1rem" pt="0.5rem" pb="1.5rem">
              {stepIndex === 0 ? (
                stepOneSettings
              ) : (
                <LaterStepAuthSettings
                  form={form}
                  step={step}
                  stepIndex={stepIndex}
                />
              )}
            </AccordionPanel>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

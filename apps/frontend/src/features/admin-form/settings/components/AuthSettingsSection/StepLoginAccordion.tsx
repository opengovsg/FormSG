import { Fragment, useState } from 'react'
import { BiPencil } from 'react-icons/bi'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Divider,
  Flex,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  FormSettings,
  MultirespondentFormSettings,
} from 'formsg-shared/types'
import {
  getStepAuthType,
  isWorkflowStepAuthType,
  STEP_LOGIN_PROVIDER_LABELS,
} from 'formsg-shared/utils/step-login'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { ADMINFORM_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import Link from '~components/Link'
import { ModalCloseButton } from '~components/Modal'
import { Tag } from '~components/Tag'

import { OPEN_WORKFLOW_TAB_STATE } from '~features/admin-form/create/common/OpenWorkflowTabOnArrival'
import { StepLabel } from '~features/admin-form/create/workflow/components/WorkflowContent/StepLabel'
import { useWorkflowSurfaces } from '~features/admin-form/create/workflow/hooks/useWorkflowSurfaces'

import { StepAuthSettingsEditor } from './StepAuthSettingsEditor'

interface StepLoginAccordionProps {
  form: AdminMultirespondentFormDto
  settings: FormSettings
}

/** Familiar workflow cards, focused on authentication. All start collapsed. */
export const StepLoginAccordion = ({
  form,
  settings,
}: StepLoginAccordionProps): JSX.Element => {
  const { formId } = useParams()
  const navigate = useNavigate()
  const { cardRadius, activeCardBg } = useWorkflowSurfaces()
  const [openIndex, setOpenIndex] = useState(-1)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)
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
    if (isDirty) setPendingIndex(index)
    else applyChange(index)
  }
  const loginForm = { authType: settings.authType, esrvcId: settings.esrvcId }

  return (
    <Stack spacing="2rem">
      <Box>
        <Text textStyle="body-1" mb="1rem">
          Manage authentication for each step in your workflow.
        </Text>
        <Link as="button" type="button" onClick={() => requestChange(-2)}>
          Edit workflow in Create ↗
        </Link>
      </Box>
      <Accordion
        allowToggle
        index={openIndex}
        onChange={(index) => requestChange(index as number)}
      >
        {form.workflow.map((step, stepIndex) => {
          const authType = getStepAuthType(loginForm, form.workflow, stepIndex)
          const label = isWorkflowStepAuthType(authType)
            ? STEP_LOGIN_PROVIDER_LABELS[authType]
            : authType === FormAuthType.SP
              ? 'Singpass'
              : undefined
          return (
            <Fragment key={step._id}>
              {stepIndex > 0 ? (
                <Flex
                  direction="column"
                  align="center"
                  aria-hidden="true"
                  data-testid="settings-step-connector"
                >
                  <Divider
                    orientation="vertical"
                    h="1rem"
                    borderLeftWidth="2px"
                    borderColor="secondary.200"
                  />
                  <BxsChevronDown />
                  <Divider
                    orientation="vertical"
                    h="1rem"
                    borderLeftWidth="2px"
                    borderColor="secondary.200"
                  />
                </Flex>
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
                      textAlign="left"
                      disabled={isSaving}
                      _hover={{ bg: 'primary.50' }}
                    >
                      <Stack flex="1" spacing="0.5rem">
                        <StepLabel
                          stepNumber={stepIndex}
                          stepName={step.step_name}
                        />
                        {!isExpanded ? (
                          <Box pl="4.25rem">
                            {label ? (
                              <Tag colorScheme="secondary">{label}</Tag>
                            ) : (
                              <Text textStyle="body-2" color="secondary.400">
                                Login not enabled
                              </Text>
                            )}
                          </Box>
                        ) : null}
                      </Stack>
                      <Icon
                        as={BiPencil}
                        color="secondary.300"
                        boxSize="1.5rem"
                      />
                    </AccordionButton>
                    <AccordionPanel px="2rem" pt="0" pb="2rem">
                      {isExpanded ? (
                        <StepAuthSettingsEditor
                          form={form}
                          settings={settings as MultirespondentFormSettings}
                          step={step}
                          stepIndex={stepIndex}
                          onClose={() => setOpenIndex(-1)}
                          onDirtyChange={setIsDirty}
                          onSavingChange={setIsSaving}
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
      <Modal
        isOpen={pendingIndex !== null}
        onClose={() => setPendingIndex(null)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>Discard unsaved changes?</ModalHeader>
          <ModalBody>
            Your authentication changes have not been saved.
          </ModalBody>
          <ModalFooter gap="1rem">
            <Button variant="clear" onClick={() => setPendingIndex(null)}>
              Keep editing
            </Button>
            <Button
              colorScheme="danger"
              onClick={() => {
                if (pendingIndex !== null) applyChange(pendingIndex)
                setPendingIndex(null)
              }}
            >
              Discard changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  )
}

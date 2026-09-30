import { ReactNode, useEffect, useRef, useState } from 'react'
import { IconType } from 'react-icons'
import {
  BiBell,
  BiCheck,
  BiEdit,
  BiSend,
  BiStopCircle,
  BiUndo,
  BiUser,
} from 'react-icons/bi'
import {
  Box,
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { useToast } from '~hooks/useToast'
import Badge from '~components/Badge'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import { ModalCloseButton } from '~components/Modal'
import { Tab } from '~components/Tabs'
import Textarea from '~components/Textarea'
import Tooltip from '~components/Tooltip'

import { usePrototypeStore } from './context'
import {
  ActivityEvent,
  getNotificationPlan,
  getReturnTargets,
  getUnavailableReason,
  InterventionAction,
  InterventionDraft,
  validateDraft,
} from './model'

const actions: {
  action: InterventionAction
  label: string
  title: string
  icon: IconType
}[] = [
  {
    action: 'sendBack',
    icon: BiUndo,
    label: 'Send back',
    title: 'Send back to an earlier step',
  },
  {
    action: 'reassign',
    icon: BiUser,
    label: 'Reassign',
    title: 'Assign current step to someone else',
  },
  {
    action: 'remind',
    icon: BiBell,
    label: 'Remind',
    title: 'Remind the current recipients',
  },
  {
    action: 'stop',
    label: 'Stop',
    title: 'Stop this workflow',
    icon: BiStopCircle,
  },
]
const Recipients = ({ recipients }: { recipients: string[] }) =>
  recipients.length ? (
    <Text textStyle="body-2" overflowWrap="anywhere">
      {recipients.join(', ')}
    </Text>
  ) : null
const eventLabels: Record<string, string> = {
  submitted: 'Submitted',
  completed: 'Step completed',
  stepCompleted: 'Step completed',
  sendBack: 'Sent back',
  reassign: 'Reassigned',
  remind: 'Reminder sent',
  stop: 'Workflow stopped',
  resubmitted: 'Corrections submitted',
  rejected: 'Rejected',
}
const eventIcons: Record<ActivityEvent['action'], IconType> = {
  rejected: BiStopCircle,
  submitted: BiSend,
  resubmitted: BiEdit,
  stepCompleted: BiCheck,
  sendBack: BiUndo,
  reassign: BiUser,
  remind: BiBell,
  stop: BiStopCircle,
}
const Activity = ({
  event,
  isLast,
}: {
  event: ActivityEvent
  isLast: boolean
}) => {
  const EventIcon = eventIcons[event.action]
  const recipientLabels: Partial<Record<ActivityEvent['action'], string>> = {
    sendBack: 'Sent back to',
    reassign: 'Reassigned to',
    remind: 'Reminder sent to',
  }
  const recipientLabel = recipientLabels[event.action]
  const notified = [
    ...new Set(Object.values(event.notifications).flat()),
  ].filter((email) => !recipientLabel || !event.recipients.includes(email))
  const hasPeople =
    (!!recipientLabel && !!event.recipients.length) || !!notified.length
  return (
    <Box position="relative" pb={isLast ? 0 : '2rem'} data-event-id={event.id}>
      {!isLast && (
        <Box
          position="absolute"
          left="15px"
          top="1rem"
          bottom="-1rem"
          w="2px"
          bg="neutral.300"
          aria-hidden
        />
      )}
      <Box
        position="absolute"
        top={0}
        left={0}
        boxSize="2rem"
        bg="secondary.100"
        color="secondary.500"
        borderRadius="full"
        borderWidth="3px"
        borderColor="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        aria-hidden
      >
        <EventIcon fontSize="1.25rem" />
      </Box>
      <Stack ml="3rem" spacing="0.75rem" minW={0}>
        <Box>
          <Text
            as="h3"
            textStyle="subhead-1"
            pt="0.125rem"
            overflowWrap="anywhere"
          >
            {eventLabels[event.action]} by {event.actor}
          </Text>
          <Text textStyle="body-2" color="secondary.400" mt="0.25rem">
            {new Date(event.at).toLocaleString('en-SG', {
              timeZone: 'Asia/Singapore',
            })}
          </Text>
        </Box>
        <Stack direction="row" spacing="0.5rem" flexWrap="wrap" align="center">
          {event.previousStep && event.previousStep.id !== event.step.id && (
            <>
              <Text textStyle="body-2" color="secondary.400">
                From
              </Text>
              <Badge
                variant="subtle"
                colorScheme="secondary"
                whiteSpace="normal"
              >
                Step {event.previousStep.number} · {event.previousStep.name}
              </Badge>
              <Text textStyle="body-2" color="secondary.400">
                to
              </Text>
            </>
          )}
          <Badge variant="subtle" colorScheme="secondary" whiteSpace="normal">
            Step {event.step.number} · {event.step.name}
          </Badge>
        </Stack>
        {(!!event.reason || hasPeople) && (
          <Stack
            bg="secondary.100"
            p="1rem"
            borderRadius="0.25rem"
            spacing="0.75rem"
          >
            {!!event.reason && (
              <Box>
                <Text textStyle="subhead-2" mb="0.25rem">
                  {event.action === 'sendBack'
                    ? 'What needs correcting'
                    : 'Reason'}
                </Text>
                <Text
                  textStyle="body-2"
                  whiteSpace="pre-wrap"
                  overflowWrap="anywhere"
                >
                  {event.reason}
                </Text>
              </Box>
            )}
            {event.reason && hasPeople && (
              <Box borderTopWidth="1px" borderColor="neutral.300" />
            )}
            {!!recipientLabel && !!event.recipients.length && (
              <Box>
                <Text textStyle="subhead-2" mb="0.25rem">
                  {recipientLabel}
                </Text>
                <Recipients recipients={event.recipients} />
              </Box>
            )}
            {!!notified.length && (
              <Box>
                <Text textStyle="subhead-2" mb="0.25rem">
                  {recipientLabel ? 'Also notified' : 'Notified'}
                </Text>
                <Recipients recipients={notified} />
              </Box>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}

export const ResponseDrawerExploration = ({
  responseId,
  overview,
  children,
}: {
  responseId: string
  overview: ReactNode
  children: ReactNode
}): JSX.Element => {
  const store = usePrototypeStore()
  const response = store.responses.find((item) => item.id === responseId)
  const [tab, setTab] = useState(0)
  const [modal, setModal] = useState<{
    action: InterventionAction
    revision: number
    id: string
  } | null>(null)
  const [draft, setDraft] = useState<InterventionDraft>({})
  const [errors, setErrors] = useState<ReturnType<typeof validateDraft>>({})
  const endRef = useRef<HTMLDivElement>(null)
  const fields = useRef<
    Record<string, HTMLInputElement | HTMLTextAreaElement | null>
  >({})
  const toast = useToast({ isClosable: true })
  const size = useBreakpointValue({ base: 'mobile', md: 'md' })
  const close = () => {
    setModal(null)
    setDraft({})
    setErrors({})
  }
  useEffect(() => {
    setModal(null)
    setDraft({})
    setErrors({})
  }, [store.resetVersion, responseId])
  if (!response)
    return (
      <>
        {overview}
        {children}
      </>
    )
  const open = (action: InterventionAction) => {
    const error = getUnavailableReason(response, action)
    if (error) {
      toast({ status: 'danger', description: error })
      return
    }
    const first = getReturnTargets(response)[0]
    setDraft({
      targetStepId: first?.id,
      recipientSource: first?.identifierEmail ? 'identifier' : 'manual',
      recipientEmail: '',
      reason: '',
      notifySubmitter: false,
    })
    setErrors({})
    setModal({ action, revision: response.revision, id: crypto.randomUUID() })
  }
  const update = (change: Partial<InterventionDraft>) => {
    const next = { ...draft, ...change }
    setDraft(next)
    if (modal) {
      const nextErrors = validateDraft(response, modal.action, next)
      setErrors(
        Object.fromEntries(
          Object.keys(errors).map((key) => [
            key,
            nextErrors[key as keyof typeof nextErrors],
          ]),
        ),
      )
    }
  }
  const confirm = () => {
    if (!modal) return
    const unavailable = getUnavailableReason(response, modal.action)
    if (response.revision !== modal.revision || unavailable) {
      toast({
        status: 'danger',
        description:
          unavailable ??
          'This response changed while the dialog was open. Close it and try again.',
      })
      return
    }
    const validation = validateDraft(response, modal.action, draft)
    if (Object.values(validation).some(Boolean)) {
      setErrors(validation)
      const key = ['targetStepId', 'recipientEmail', 'reason'].find(
        (key) => validation[key as keyof typeof validation],
      )
      if (key) fields.current[key]?.focus()
      return
    }
    const result = store.dispatch(
      response.id,
      modal.action,
      draft,
      modal.revision,
      modal.id,
    )
    if (!result.ok) {
      toast({ status: 'danger', description: result.message })
      return
    }
    close()
    toast({
      status: 'success',
      description: (
        <Stack direction="row" align="center">
          <Text>
            {
              {
                sendBack: 'Response sent back for corrections.',
                reassign: 'Current step reassigned.',
                remind: 'Reminder sent.',
                stop: 'Workflow stopped.',
              }[modal.action]
            }
          </Text>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setTab(1)
              requestAnimationFrame(() =>
                document
                  .querySelector(`[data-event-id="${result.event.id}"]`)
                  ?.scrollIntoView({ block: 'nearest' }),
              )
            }}
          >
            View activity
          </Button>
        </Stack>
      ),
    })
  }
  const targets = getReturnTargets(response)
  const target = response.steps.find((item) => item.id === draft.targetStepId)
  const notifications = modal
    ? getNotificationPlan(response, modal.action, draft)
    : null
  const notificationRecipients = notifications
    ? [...new Set(Object.values(notifications).flat())]
    : []
  return (
    <Stack spacing="1.5rem">
      {overview}
      <Tabs
        index={tab}
        onChange={setTab}
        variant="line-light"
        isLazy
        lazyBehavior="keepMounted"
      >
        <Box
          position={{ base: 'static', md: 'sticky' }}
          top="-1.5rem"
          zIndex={1}
          bg="white"
          pt="0.5rem"
        >
          <Stack direction="row" spacing="0.5rem" flexWrap="wrap" pb="1rem">
            {actions.map(({ action, label, title, icon: ActionIcon }) => (
              <Tooltip key={action} label={title}>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<ActionIcon fontSize="1.25rem" aria-hidden />}
                  colorScheme={action === 'stop' ? 'danger' : 'secondary'}
                  onClick={() => open(action)}
                >
                  {label}
                </Button>
              </Tooltip>
            ))}
          </Stack>
          <TabList>
            <Tab>Responses</Tab>
            <Tab>Activity</Tab>
          </TabList>
        </Box>
        <TabPanels pt="1.5rem">
          <TabPanel>{children}</TabPanel>
          <TabPanel>
            <Stack spacing={0}>
              {response.history.map((event, index) => (
                <Activity
                  event={event}
                  key={event.id}
                  isLast={index === response.history.length - 1}
                />
              ))}
              <Box ref={endRef} />
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>
      <Modal isOpen={!!modal} onClose={close} size={size}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>
            {actions.find((item) => item.action === modal?.action)?.title}
          </ModalHeader>
          <ModalBody>
            <Stack spacing="1.5rem">
              {modal?.action === 'sendBack' && (
                <>
                  <Text>
                    Return this response for corrections. The full earlier step
                    will receive it, and subsequent steps will run again after
                    corrections.
                  </Text>
                  <FormControl isRequired isInvalid={!!errors.targetStepId}>
                    <FormLabel>Send back to step</FormLabel>
                    <SingleSelect
                      name="targetStepId"
                      ref={(element) => {
                        fields.current.targetStepId = element
                      }}
                      value={draft.targetStepId ?? ''}
                      items={targets.map((step) => ({
                        value: step.id,
                        label: `Step ${step.number} · ${step.name}`,
                      }))}
                      isClearable={false}
                      onChange={(value) => {
                        const step = response.steps.find(
                          (item) => item.id === value,
                        )
                        update({
                          targetStepId: value,
                          recipientSource: step?.identifierEmail
                            ? 'identifier'
                            : 'manual',
                          recipientEmail: '',
                        })
                      }}
                    />
                    <FormErrorMessage>{errors.targetStepId}</FormErrorMessage>
                  </FormControl>
                  {target?.number === 1 && (
                    <>
                      {target.identifierEmail && (
                        <Checkbox
                          isChecked={draft.recipientSource === 'manual'}
                          onChange={(event) =>
                            update({
                              recipientSource: event.target.checked
                                ? 'manual'
                                : 'identifier',
                            })
                          }
                        >
                          Send to a different correction email
                        </Checkbox>
                      )}
                      {draft.recipientSource === 'manual' ? (
                        <EmailField
                          draft={draft}
                          error={errors.recipientEmail}
                          update={update}
                          inputRef={(element) => {
                            fields.current.recipientEmail = element
                          }}
                          label="Correction recipient email"
                        />
                      ) : (
                        <Text>Goes to {target.identifierEmail}</Text>
                      )}
                      <Text textStyle="body-2">
                        The original submitter identity and answers are
                        retained.
                      </Text>
                    </>
                  )}
                </>
              )}
              {modal?.action === 'reassign' && (
                <>
                  <Text>
                    The current step stays the same. The new person replaces all
                    its current recipients.
                  </Text>
                  <EmailField
                    draft={draft}
                    error={errors.recipientEmail}
                    update={update}
                    inputRef={(element) => {
                      fields.current.recipientEmail = element
                    }}
                    label="New recipient email"
                  />
                </>
              )}
              {modal?.action === 'remind' && (
                <>
                  <Text>
                    Send a reminder to everyone currently assigned to this step.
                  </Text>
                  <Recipients recipients={response.currentRecipients} />
                </>
              )}
              {modal?.action === 'stop' && (
                <>
                  <Text>
                    Progression and reminders stop. Answers and activity history
                    remain. This workflow cannot be resumed in this exploration.
                  </Text>
                  <Checkbox
                    isChecked={!!draft.notifySubmitter}
                    onChange={(event) =>
                      update({ notifySubmitter: event.target.checked })
                    }
                  >
                    Also notify the original submitter
                  </Checkbox>
                </>
              )}
              {modal && modal.action !== 'remind' && (
                <FormControl
                  isRequired={modal.action !== 'reassign'}
                  isInvalid={!!errors.reason}
                >
                  <FormLabel>
                    {modal.action === 'sendBack'
                      ? 'What needs correcting'
                      : 'Reason'}
                  </FormLabel>
                  <Textarea
                    ref={(element) => {
                      fields.current.reason = element
                    }}
                    value={draft.reason ?? ''}
                    onChange={(event) => update({ reason: event.target.value })}
                  />
                  <FormErrorMessage>{errors.reason}</FormErrorMessage>
                </FormControl>
              )}
              {!!notificationRecipients.length && (
                <Box bg="primary.100" p="1rem">
                  <Text textStyle="subhead-2" mb="0.5rem">
                    Who is notified
                  </Text>
                  {notifications &&
                    (
                      [
                        ['Action required', notifications.actionRequired],
                        ['Current task withdrawn', notifications.displaced],
                        [
                          'Review again after corrections',
                          notifications.reviewAgain,
                        ],
                        [
                          'Update only',
                          notifications.updates.filter(
                            (email) =>
                              !notifications.displaced.includes(email) &&
                              !notifications.reviewAgain.includes(email),
                          ),
                        ],
                      ] as [string, string[]][]
                    ).map(
                      ([label, recipients]) =>
                        recipients.length > 0 && (
                          <Box key={label} mb="0.75rem">
                            <Text textStyle="subhead-2">{label}</Text>
                            <Recipients recipients={recipients} />
                          </Box>
                        ),
                    )}
                </Box>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Stack
              direction={{ base: 'column-reverse', md: 'row' }}
              w="100%"
              justify="flex-end"
            >
              <Button variant="clear" colorScheme="secondary" onClick={close}>
                Cancel
              </Button>
              <Button
                colorScheme={modal?.action === 'stop' ? 'danger' : 'primary'}
                onClick={confirm}
              >
                {actions.find((item) => item.action === modal?.action)?.label}
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  )
}
const EmailField = ({
  draft,
  error,
  update,
  inputRef,
  label,
}: {
  draft: InterventionDraft
  error?: string
  update: (change: Partial<InterventionDraft>) => void
  inputRef: (element: HTMLInputElement | null) => void
  label: string
}) => (
  <FormControl isRequired isInvalid={!!error}>
    <FormLabel>{label}</FormLabel>
    <Input
      ref={inputRef}
      value={draft.recipientEmail ?? ''}
      type="email"
      onChange={(event) => update({ recipientEmail: event.target.value })}
    />
    <FormErrorMessage>{error}</FormErrorMessage>
  </FormControl>
)

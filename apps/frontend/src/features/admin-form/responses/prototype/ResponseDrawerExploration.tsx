import { Fragment, ReactNode, useEffect, useRef, useState } from 'react'
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
            borderRadius="8px"
            spacing="0.75rem"
          >
            {!!event.reason && (
              <Box>
                <Text textStyle="subhead-2" mb="0.25rem">
                  {event.action === 'sendBack'
                    ? 'Reason for sending back'
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
              <Box borderTopWidth="1px" borderColor="neutral.300" mx="-1rem" />
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
  const [actionsPinned, setActionsPinned] = useState(false)
  const stickyMarkerRef = useRef<HTMLDivElement>(null)
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
  useEffect(() => {
    const marker = stickyMarkerRef.current
    if (!marker) return
    let root = marker.parentElement
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) {
      root = root.parentElement
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setActionsPinned(
          !entry.isIntersecting &&
            entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0),
        )
      },
      { root, rootMargin: '-12px 0px 0px 0px', threshold: 0 },
    )
    observer.observe(marker)
    return () => observer.disconnect()
  }, [response?.id])
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
  const notifiedGroups = new Map<string, string[]>()
  for (const email of notifications?.updates ?? []) {
    const step = response.steps.find((item) =>
      item.id === response.currentStepId
        ? response.currentRecipients.includes(email)
        : item.configuredRecipients.includes(email) ||
          response.history.some(
            (event) =>
              event.action === 'stepCompleted' &&
              event.step.id === item.id &&
              event.recipients.includes(email),
          ),
    )
    const label = step
      ? `Step ${step.number}`
      : email === response.submitterEmail
        ? 'Original submitter'
        : 'Other recipients'
    notifiedGroups.set(label, [...(notifiedGroups.get(label) ?? []), email])
  }
  return (
    <Stack spacing="1.5rem">
      <Tabs
        index={tab}
        onChange={setTab}
        variant="line-light"
        isLazy
        lazyBehavior="keepMounted"
      >
        <Box
          bg="primary.100"
          p="1.5rem"
          border="1px solid"
          borderColor="neutral.300"
          borderBottomWidth={0}
          borderTopRadius="8px"
        >
          {overview}
        </Box>
        <Box ref={stickyMarkerRef} h="1px" mb="-1px" aria-hidden />
        <Box
          position="sticky"
          top="-0.75rem"
          zIndex={1}
          bg="primary.100"
          px="1.5rem"
          py={actionsPinned ? '1rem' : '1.5rem'}
          border="1px solid"
          borderColor="neutral.300"
          borderRadius={actionsPinned ? '8px' : '0 0 8px 8px'}
          boxShadow={actionsPinned ? '0 4px 8px rgba(0, 0, 0, 0.08)' : 'none'}
          transitionProperty="border-radius, box-shadow"
          transitionDuration="normal"
        >
          <Stack direction="row" spacing="0.5rem" flexWrap="wrap">
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
        </Box>
        <TabList mt="1.5rem">
          <Tab>Responses</Tab>
          <Tab>Activity</Tab>
        </TabList>
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
                    The form will include the answers already submitted, so the
                    recipient can update them without starting again.
                  </Text>
                  <FormControl isRequired isInvalid={!!errors.targetStepId}>
                    <FormLabel>Send back to step</FormLabel>
                    {targets.length === 1 ? (
                      <Text>
                        Step {targets[0].number} · {targets[0].name}
                      </Text>
                    ) : (
                      <SingleSelect
                        usePortal={false}
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
                    )}
                    <FormErrorMessage>{errors.targetStepId}</FormErrorMessage>
                  </FormControl>
                  {!!notifications?.actionRequired.length && (
                    <Box>
                      <Text textStyle="subhead-1" mb="0.25rem">
                        Sent back to
                      </Text>
                      <RecipientTags
                        recipients={notifications.actionRequired}
                      />
                    </Box>
                  )}
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
                          Send to a different email address
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
                          label="Step 1 email address"
                        />
                      ) : null}
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
              {modal?.action !== 'sendBack' &&
                !!notifications?.actionRequired.length && (
                  <Box>
                    <Text textStyle="subhead-1" mb="0.25rem">
                      {modal?.action === 'remind'
                        ? 'Reminder sent to'
                        : 'Reassigned to'}
                    </Text>
                    <Recipients recipients={notifications.actionRequired} />
                  </Box>
                )}
              {modal && modal.action !== 'remind' && (
                <FormControl
                  isRequired={modal.action !== 'reassign'}
                  isInvalid={!!errors.reason}
                >
                  <FormLabel>
                    {modal.action === 'sendBack'
                      ? 'Reason for sending back'
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
              {!!notifications?.updates.length && (
                <Box>
                  <Text textStyle="subhead-1" mb="0.25rem">
                    {modal?.action === 'stop' ? 'Notified' : 'Also notified'}
                  </Text>
                  <Stack
                    bg="secondary.100"
                    p="1rem"
                    borderRadius="8px"
                    spacing="0.75rem"
                  >
                    {[...notifiedGroups]
                      .sort(([a], [b]) =>
                        a.localeCompare(b, undefined, { numeric: true }),
                      )
                      .map(([label, emails], index) => (
                        <Fragment key={label}>
                          {index > 0 && (
                            <Box
                              borderTopWidth="1px"
                              borderColor="neutral.300"
                              mx="-1rem"
                            />
                          )}
                          <Box>
                            <Text textStyle="subhead-2" mb="0.5rem">
                              {label}
                            </Text>
                            <Recipients recipients={emails} />
                          </Box>
                        </Fragment>
                      ))}
                  </Stack>
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

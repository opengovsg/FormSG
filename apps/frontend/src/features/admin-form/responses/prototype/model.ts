/** Frontend-only workflow simulation. No production workflow contracts or requests. */
export const DEMO_FORM_ID = '6a0000000000000000000001'
export const DEMO_ADMIN_EMAIL = 'admin@example.org'

export type InterventionAction = 'sendBack' | 'reassign' | 'remind' | 'stop'
export type ActivityAction =
  | InterventionAction
  | 'submitted'
  | 'resubmitted'
  | 'stepCompleted'
  | 'rejected'
export type PrototypeStatus = 'pending' | 'stopped' | 'completed' | 'rejected'
export interface PrototypeStep {
  id: string
  number: number
  name: string
  configuredRecipients: string[]
  identifierEmail?: string
}
export interface NotificationPlan {
  actionRequired: string[]
  updates: string[]
  displaced: string[]
  reviewAgain: string[]
}
export interface ActivityEvent {
  id: string
  responseId: string
  action: ActivityAction
  actor: string
  at: string
  step: PrototypeStep
  previousStep?: PrototypeStep
  previousRecipients: string[]
  recipients: string[]
  reason?: string
  recipientSource?: 'identifier' | 'manual' | 'step'
  notifications: NotificationPlan
}
export interface PrototypeResponse {
  id: string
  submittedAt: string
  submitterEmail: string
  status: PrototypeStatus
  currentStepId: string | null
  currentRecipients: string[]
  revision: number
  steps: PrototypeStep[]
  answers: { id: string; label: string; value: string }[]
  history: ActivityEvent[]
}
export interface InterventionDraft {
  targetStepId?: string
  recipientEmail?: string
  recipientSource?: 'identifier' | 'manual'
  reason?: string
  notifySubmitter?: boolean
}
export type DraftErrors = Partial<
  Record<'targetStepId' | 'recipientEmail' | 'reason', string>
>
export interface InterventionCommand {
  id: string
  expectedRevision: number
  action: InterventionAction
  draft: InterventionDraft
  actor: string
  at: string
}
export type InterventionResult =
  | { ok: true; response: PrototypeResponse; event: ActivityEvent }
  | { ok: false; message: string; errors?: DraftErrors }

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const unique = (emails: string[]) => [
  ...new Set(emails.map((email) => email.trim())),
]
export const isValidPrototypeEmail = (email: string) =>
  /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email.trim())
export const getCurrentStep = (response: PrototypeResponse) =>
  response.steps.find((step) => step.id === response.currentStepId)
export function getReturnTargets(response: PrototypeResponse): PrototypeStep[] {
  const current = getCurrentStep(response)
  return current
    ? response.steps.filter((step) => step.number < current.number)
    : []
}
export function getUnavailableReason(
  response: PrototypeResponse,
  action: InterventionAction,
): string | null {
  if (response.status === 'stopped')
    return 'This workflow has stopped. No further actions can be taken.'
  if (response.status === 'rejected')
    return 'This workflow was rejected. No further actions can be taken.'
  if (response.status === 'completed')
    return 'This workflow is complete. No further actions can be taken.'
  if (!getCurrentStep(response)) return 'There is no current step to act on.'
  if (action === 'sendBack' && !getReturnTargets(response).length)
    return 'This response is at Step 1. There is no earlier step to send it back to.'
  if (action !== 'sendBack' && !response.currentRecipients.length)
    return 'There are no recipients assigned to the current step.'
  return null
}
function destinationRecipients(
  response: PrototypeResponse,
  draft: InterventionDraft,
): string[] {
  const target = getReturnTargets(response).find(
    (step) => step.id === draft.targetStepId,
  )
  if (!target) return []
  if (target.number !== 1) return [...target.configuredRecipients]
  const email =
    draft.recipientSource === 'manual'
      ? draft.recipientEmail
      : target.identifierEmail
  return email?.trim() ? [email.trim()] : []
}
export function validateDraft(
  response: PrototypeResponse,
  action: InterventionAction,
  draft: InterventionDraft,
): DraftErrors {
  const errors: DraftErrors = {}
  if ((action === 'sendBack' || action === 'stop') && !draft.reason?.trim())
    errors.reason =
      action === 'sendBack'
        ? 'Enter what needs correcting.'
        : 'Enter a reason for stopping this workflow.'
  if (
    action === 'reassign' &&
    !isValidPrototypeEmail(draft.recipientEmail ?? '')
  )
    errors.recipientEmail = 'Enter a valid email address.'
  if (action === 'sendBack') {
    const target = getReturnTargets(response).find(
      (step) => step.id === draft.targetStepId,
    )
    if (!target) errors.targetStepId = 'Choose an earlier step.'
    else if (
      !destinationRecipients(response, draft).length ||
      destinationRecipients(response, draft).some(
        (email) => !isValidPrototypeEmail(email),
      )
    )
      errors.recipientEmail =
        target.number === 1
          ? 'Enter a valid correction recipient email.'
          : 'This step has no valid configured recipients.'
  }
  return errors
}
/** Resolve audiences from the last active cycle, while retaining earlier history. */
export function getNotificationPlan(
  response: PrototypeResponse,
  action: InterventionAction,
  draft: InterventionDraft,
): NotificationPlan {
  let actionRequired: string[] = []
  let displaced: string[] = []
  let reviewAgain: string[] = []
  const current = getCurrentStep(response)
  if (action === 'sendBack') {
    actionRequired = destinationRecipients(response, draft)
    displaced = response.currentRecipients.filter(
      (email) => !actionRequired.includes(email),
    )
    const target = getReturnTargets(response).find(
      (step) => step.id === draft.targetStepId,
    )
    const completed = new Map<string, ActivityEvent>()
    for (const event of response.history) {
      if (event.action === 'sendBack') {
        for (const [id, completion] of completed)
          if (completion.step.number >= event.step.number) completed.delete(id)
      }
      if (event.action === 'stepCompleted') completed.set(event.step.id, event)
    }
    reviewAgain = unique(
      [...completed.values()]
        .filter(
          (event) =>
            event.step.number > (target?.number ?? Infinity) &&
            event.step.number < (current?.number ?? 0),
        )
        .flatMap((event) => event.recipients),
    ).filter(
      (email) => !actionRequired.includes(email) && !displaced.includes(email),
    )
  } else if (action === 'reassign')
    actionRequired = draft.recipientEmail?.trim()
      ? [draft.recipientEmail.trim()]
      : []
  else if (action === 'remind') actionRequired = [...response.currentRecipients]
  const updates =
    action === 'remind'
      ? []
      : unique([
          ...response.currentRecipients,
          ...reviewAgain,
          ...(action === 'stop' && draft.notifySubmitter !== false
            ? [response.submitterEmail]
            : []),
        ]).filter((email) => !actionRequired.includes(email))
  return {
    actionRequired: unique(actionRequired),
    updates,
    displaced: unique(displaced),
    reviewAgain,
  }
}
export function applyIntervention(
  response: PrototypeResponse,
  command: InterventionCommand,
): InterventionResult {
  if (response.history.some((event) => event.id === command.id))
    return { ok: false, message: 'This action has already been applied.' }
  if (response.revision !== command.expectedRevision)
    return {
      ok: false,
      message:
        'This response changed while the modal was open. Close it and try again.',
    }
  const unavailable = getUnavailableReason(response, command.action)
  if (unavailable) return { ok: false, message: unavailable }
  const errors = validateDraft(response, command.action, command.draft)
  if (Object.keys(errors).length)
    return { ok: false, message: 'Check the highlighted fields.', errors }
  const previousStep = getCurrentStep(response)!
  const target =
    command.action === 'sendBack'
      ? getReturnTargets(response).find(
          (step) => step.id === command.draft.targetStepId,
        )!
      : previousStep
  const notifications = getNotificationPlan(
    response,
    command.action,
    command.draft,
  )
  const event: ActivityEvent = copy({
    id: command.id,
    responseId: response.id,
    action: command.action,
    actor: command.actor,
    at: command.at,
    step: target,
    previousStep: command.action === 'sendBack' ? previousStep : undefined,
    previousRecipients: response.currentRecipients,
    recipients:
      command.action === 'stop'
        ? response.currentRecipients
        : notifications.actionRequired,
    reason: command.draft.reason?.trim() || undefined,
    recipientSource:
      command.action === 'sendBack'
        ? target.number === 1
          ? (command.draft.recipientSource ?? 'identifier')
          : 'step'
        : undefined,
    notifications,
  })
  return {
    ok: true,
    event,
    response: {
      ...response,
      revision: response.revision + 1,
      status: command.action === 'stop' ? 'stopped' : 'pending',
      currentStepId: command.action === 'stop' ? null : target.id,
      currentRecipients:
        command.action === 'stop'
          ? []
          : command.action === 'remind'
            ? [...response.currentRecipients]
            : [...event.recipients],
      history: [...response.history, event],
    },
  }
}

const steps: PrototypeStep[] = [
  {
    id: '6a0000000000000000000101',
    number: 1,
    name: 'Submitter',
    configuredRecipients: [],
  },
  {
    id: '6a0000000000000000000102',
    number: 2,
    name: 'Team lead',
    configuredRecipients: ['lead@example.org', 'deputy@example.org'],
  },
  {
    id: '6a0000000000000000000103',
    number: 3,
    name: 'Workplace team',
    configuredRecipients: [
      'workplace@example.org',
      'facilities@example.org',
      'operations@example.org',
      'coordinator@example.org',
    ],
  },
]
const emptyNotifications = (): NotificationPlan => ({
  actionRequired: [],
  updates: [],
  displaced: [],
  reviewAgain: [],
})
function seedEvent(
  responseId: string,
  index: number,
  action: 'submitted' | 'resubmitted' | 'stepCompleted' | 'rejected',
  step: PrototypeStep,
  actor: string,
): ActivityEvent {
  return {
    id: `${responseId}-seed-${index}`,
    responseId,
    action,
    actor,
    at: `2026-09-${String(10 + index).padStart(2, '0')}T01:00:00.000Z`,
    step: copy(step),
    previousRecipients: [],
    recipients: step.number === 1 ? [actor] : [...step.configuredRecipients],
    notifications: emptyNotifications(),
  }
}
export function createPrototypeResponses(): PrototypeResponse[] {
  const first: PrototypeResponse = {
    id: '6a0000000000000000000011',
    submittedAt: '2026-09-10T01:00:00.000Z',
    submitterEmail: 'submitter@example.org',
    status: 'pending',
    currentStepId: steps[1].id,
    currentRecipients: [...steps[1].configuredRecipients],
    revision: 0,
    steps: copy(steps),
    answers: [
      {
        id: '6a0000000000000000000201',
        label: 'Name',
        value: 'Demo submitter',
      },
      {
        id: '6a0000000000000000000202',
        label: 'Suggestion',
        value: 'Add recycling bins near the meeting rooms.',
      },
      { id: '6a0000000000000000000203', label: 'Location', value: 'Level 4' },
    ],
    history: [],
  }
  first.history = [
    seedEvent(first.id, 0, 'submitted', first.steps[0], first.submitterEmail),
  ]
  const second = copy(first)
  second.id = '6a0000000000000000000012'
  second.steps[0].identifierEmail = second.submitterEmail
  second.answers[1].value = 'Improve soundproofing in the shared meeting rooms.'
  second.history = [
    seedEvent(
      second.id,
      0,
      'submitted',
      second.steps[0],
      second.submitterEmail,
    ),
  ]
  const returnCommand = {
    id: `${second.id}-return`,
    expectedRevision: 0,
    action: 'sendBack' as const,
    draft: {
      targetStepId: second.steps[0].id,
      reason: 'Please identify which meeting rooms need soundproofing.',
    },
    actor: DEMO_ADMIN_EMAIL,
    at: '2026-09-11T02:00:00.000Z',
  }
  const returned = applyIntervention(second, returnCommand)
  if (returned.ok) second.history = returned.response.history
  second.history.push(
    seedEvent(
      second.id,
      2,
      'resubmitted',
      second.steps[0],
      second.submitterEmail,
    ),
    seedEvent(
      second.id,
      3,
      'stepCompleted',
      second.steps[1],
      'lead@example.org',
    ),
  )
  second.currentStepId = second.steps[2].id
  second.currentRecipients = [...second.steps[2].configuredRecipients]
  second.revision = 1
  const reassigned = applyIntervention(second, {
    id: `${second.id}-reassign`,
    expectedRevision: 1,
    action: 'reassign',
    draft: {
      recipientEmail: 'specialist@example.org',
      reason: 'Please assess the soundproofing request.',
    },
    actor: DEMO_ADMIN_EMAIL,
    at: '2026-09-14T02:00:00.000Z',
  })
  const historySample = reassigned.ok ? reassigned.response : second
  const stoppedBase = copy(first)
  stoppedBase.id = '6a0000000000000000000013'
  stoppedBase.steps[0].identifierEmail = stoppedBase.submitterEmail
  stoppedBase.history = [
    seedEvent(
      stoppedBase.id,
      0,
      'submitted',
      stoppedBase.steps[0],
      stoppedBase.submitterEmail,
    ),
  ]
  stoppedBase.answers[1].value =
    'Replace a chair that has already been replaced.'
  const stopped = applyIntervention(stoppedBase, {
    id: `${stoppedBase.id}-stop`,
    expectedRevision: 0,
    action: 'stop',
    draft: {
      reason: 'This request has already been resolved.',
      notifySubmitter: true,
    },
    actor: DEMO_ADMIN_EMAIL,
    at: '2026-09-12T02:00:00.000Z',
  })
  const completed = copy(first)
  completed.id = '6a0000000000000000000014'
  completed.status = 'completed'
  completed.currentStepId = null
  completed.currentRecipients = []
  completed.steps[0].identifierEmail = completed.submitterEmail
  completed.answers[1].value = 'Provide whiteboards in the meeting rooms.'
  completed.history = [
    seedEvent(
      completed.id,
      0,
      'submitted',
      completed.steps[0],
      completed.submitterEmail,
    ),
    seedEvent(
      completed.id,
      1,
      'stepCompleted',
      completed.steps[1],
      'lead@example.org',
    ),
    seedEvent(
      completed.id,
      2,
      'stepCompleted',
      completed.steps[2],
      'workplace@example.org',
    ),
  ]
  const rejected = copy(first)
  rejected.id = '6a0000000000000000000015'
  rejected.status = 'rejected'
  rejected.currentStepId = null
  rejected.currentRecipients = []
  rejected.steps[0].identifierEmail = rejected.submitterEmail
  rejected.answers[1].value = 'Install a private coffee machine at every desk.'
  rejected.history = [
    seedEvent(
      rejected.id,
      0,
      'submitted',
      rejected.steps[0],
      rejected.submitterEmail,
    ),
    {
      ...seedEvent(
        rejected.id,
        1,
        'rejected',
        rejected.steps[1],
        'lead@example.org',
      ),
      reason:
        'Individual coffee machines are not supported under the office equipment policy.',
      notifications: {
        ...emptyNotifications(),
        updates: [rejected.submitterEmail],
      },
    },
  ]
  first.currentStepId = first.steps[2].id
  first.currentRecipients = [...first.steps[2].configuredRecipients]
  first.history.push(
    seedEvent(first.id, 1, 'stepCompleted', first.steps[1], 'lead@example.org'),
  )
  return [
    first,
    historySample,
    stopped.ok ? stopped.response : stoppedBase,
    completed,
    rejected,
  ]
}

/** Current pending step, or the historical step at which a workflow ended. */
export function getOverviewStep(
  response: PrototypeResponse,
): PrototypeStep | undefined {
  if (response.status === 'pending') return getCurrentStep(response)
  if (response.status === 'completed') return undefined
  const action = response.status === 'stopped' ? 'stop' : 'rejected'
  return [...response.history]
    .reverse()
    .find((event) => event.action === action)?.step
}

import type { InterventionCommand, PrototypeResponse } from './model'
import {
  applyIntervention,
  createPrototypeResponses,
  DEMO_ADMIN_EMAIL,
  getNotificationPlan,
  getOverviewStep,
  getReturnTargets,
  getUnavailableReason,
  validateDraft,
} from './model'

const command = (
  response: PrototypeResponse,
  overrides: Partial<InterventionCommand> = {},
): InterventionCommand => ({
  id: 'confirmation-1',
  expectedRevision: response.revision,
  action: 'reassign',
  draft: { recipientEmail: 'new@example.org' },
  actor: DEMO_ADMIN_EMAIL,
  at: '2026-09-30T03:00:00.000Z',
  ...overrides,
})
const apply = (
  response: PrototypeResponse,
  overrides: Partial<InterventionCommand>,
) => {
  const result = applyIntervention(response, command(response, overrides))
  if (!result.ok) throw new Error(result.message)
  return result.response
}
describe('workflow prototype state', () => {
  it('provides independent stable fixtures with a missing Step 1 identifier', () => {
    const fixtures = createPrototypeResponses()
    expect(fixtures).toHaveLength(5)
    expect(new Set(fixtures.map((response) => response.id)).size).toBe(5)
    expect(fixtures[0].steps[0].identifierEmail).toBeUndefined()
    expect(fixtures[0].currentStepId).toBe(fixtures[0].steps[2].id)
    expect(getReturnTargets(fixtures[0]).map((step) => step.number)).toEqual([
      1, 2,
    ])
    expect(fixtures[1].history.map((event) => event.action)).toEqual([
      'submitted',
      'sendBack',
      'resubmitted',
      'stepCompleted',
      'reassign',
    ])
    expect(fixtures.map((response) => response.status)).toEqual([
      'pending',
      'pending',
      'stopped',
      'completed',
      'rejected',
    ])
    fixtures[0].steps[1].configuredRecipients.push('extra@example.org')
    expect(
      createPrototypeResponses()[0].steps[1].configuredRecipients,
    ).not.toContain('extra@example.org')
  })
  it('shows the relevant current or ending step in the overview', () => {
    const [pending, , stopped, completed, rejected] = createPrototypeResponses()
    expect(getOverviewStep(pending)?.number).toBe(3)
    expect(getOverviewStep(stopped)?.number).toBe(2)
    expect(getOverviewStep(completed)).toBeUndefined()
    expect(getOverviewStep(rejected)?.number).toBe(2)
    for (const action of ['sendBack', 'reassign', 'remind', 'stop'] as const)
      expect(getUnavailableReason(rejected, action)).toContain('rejected')
  })
  it('applies once, replaces the group, and preserves snapshots', () => {
    const original = createPrototypeResponses()[0]
    const oldHistory = JSON.stringify(original.history)
    const cmd = command(original)
    const result = applyIntervention(original, cmd)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.response.currentRecipients).toEqual(['new@example.org'])
    expect(result.response.currentStepId).toBe(original.currentStepId)
    expect(result.event.previousRecipients).toEqual(original.currentRecipients)
    expect(result.response.revision).toBe(1)
    expect(JSON.stringify(original.history)).toBe(oldHistory)
    expect(result.response.history).toHaveLength(original.history.length + 1)
    expect(applyIntervention(result.response, cmd)).toMatchObject({
      ok: false,
      message: 'This action has already been applied.',
    })
    result.response.currentRecipients[0] = 'other@example.org'
    expect(result.event.recipients).toEqual(['new@example.org'])
  })
  it('rejects stale confirmations and invalid fields without changing state', () => {
    const original = createPrototypeResponses()[0]
    const before = JSON.stringify(original)
    expect(
      applyIntervention(original, command(original, { expectedRevision: 42 })),
    ).toMatchObject({ ok: false })
    expect(
      applyIntervention(
        original,
        command(original, { action: 'sendBack', draft: { reason: '   ' } }),
      ),
    ).toMatchObject({
      ok: false,
      errors: {
        targetStepId: 'Choose an earlier step.',
        reason: 'Enter what needs correcting.',
      },
    })
    expect(JSON.stringify(original)).toBe(before)
    expect(
      validateDraft(original, 'reassign', { recipientEmail: 'not an email' }),
    ).toHaveProperty('recipientEmail')
    expect(validateDraft(original, 'stop', { reason: '\n\t' })).toHaveProperty(
      'reason',
    )
    for (const recipientEmail of [
      'one,two@example.org',
      'one@example.org;two@example.org',
      'one@example.org,two@example.org',
    ])
      expect(
        validateDraft(original, 'reassign', { recipientEmail }),
      ).toHaveProperty('recipientEmail')
  })
  it('returns to the full configured step after reassignment', () => {
    const original = createPrototypeResponses()[1]
    expect(original.currentRecipients).toEqual(['specialist@example.org'])
    const returned = apply(original, {
      action: 'sendBack',
      draft: {
        targetStepId: original.steps[1].id,
        reason: 'Review the revised location.',
      },
    })
    expect(returned.currentRecipients).toEqual([
      'lead@example.org',
      'deputy@example.org',
    ])
    expect(returned.currentStepId).toBe(original.steps[1].id)
    expect(returned.status).toBe('pending')
    expect(returned.history.at(-1)?.notifications.displaced).toEqual([
      'specialist@example.org',
    ])
    expect(
      returned.history.find((event) => event.action === 'reassign')?.recipients,
    ).toEqual(['specialist@example.org'])
  })
  it('uses manual correction recipient without changing identity or answers', () => {
    const original = createPrototypeResponses()[0]
    expect(
      validateDraft(original, 'sendBack', {
        targetStepId: original.steps[0].id,
        reason: 'Correct location.',
      }),
    ).toHaveProperty('recipientEmail')
    const returned = apply(original, {
      action: 'sendBack',
      draft: {
        targetStepId: original.steps[0].id,
        reason: ' Correct location. ',
        recipientSource: 'manual',
        recipientEmail: ' alternate@example.org ',
      },
    })
    expect(returned.currentRecipients).toEqual(['alternate@example.org'])
    expect(returned.submitterEmail).toBe(original.submitterEmail)
    expect(returned.answers).toEqual(original.answers)
    expect(returned.steps[0].identifierEmail).toBeUndefined()
    expect(returned.history.at(-1)).toMatchObject({
      recipientSource: 'manual',
      reason: 'Correct location.',
    })
    expect(getUnavailableReason(returned, 'sendBack')).toContain('Step 1')
  })
  it('uses identifier by default and identifies intermediate reviewers', () => {
    const original = createPrototypeResponses()[1]
    const returned = apply(original, {
      action: 'sendBack',
      draft: { targetStepId: original.steps[0].id, reason: 'Clarify details.' },
    })
    expect(returned.currentRecipients).toEqual([original.submitterEmail])
    expect(returned.history.at(-1)?.recipientSource).toBe('identifier')
    expect(returned.history.at(-1)?.notifications.reviewAgain).toEqual([
      'lead@example.org',
      'deputy@example.org',
    ])
  })
  it('reminds all recipients without moving the workflow', () => {
    const original = createPrototypeResponses()[0]
    const reminded = apply(original, { action: 'remind', draft: {} })
    expect(reminded.currentRecipients).toEqual(original.currentRecipients)
    expect(reminded.currentStepId).toBe(original.currentStepId)
    expect(reminded.history.at(-1)?.notifications).toEqual({
      actionRequired: original.currentRecipients,
      updates: [],
      displaced: [],
      reviewAgain: [],
    })
  })
  it('stops while preserving data and optional notification audiences', () => {
    const original = createPrototypeResponses()[0]
    const stopped = apply(original, {
      action: 'stop',
      draft: { reason: 'Already resolved.', notifySubmitter: false },
    })
    expect(stopped.status).toBe('stopped')
    expect(stopped.currentStepId).toBeNull()
    expect(stopped.currentRecipients).toEqual([])
    expect(stopped.answers).toEqual(original.answers)
    expect(stopped.history.slice(0, -1)).toEqual(original.history)
    expect(stopped.history.at(-1)?.notifications.updates).toEqual(
      original.currentRecipients,
    )
    expect(
      getNotificationPlan(original, 'stop', { notifySubmitter: true }).updates,
    ).toContain(original.submitterEmail)
    for (const action of ['sendBack', 'reassign', 'remind', 'stop'] as const) {
      expect(getUnavailableReason(stopped, action)).toContain('stopped')
      expect(
        getUnavailableReason(createPrototypeResponses()[3], action),
      ).toContain('complete')
      expect(
        applyIntervention(stopped, command(stopped, { action, id: 'new-id' })),
      ).toMatchObject({ ok: false })
    }
  })
  it('preserves append order with equal timestamps', () => {
    const original = createPrototypeResponses()[0]
    const first = apply(original, { action: 'remind', draft: {}, id: 'first' })
    const second = apply(first, { action: 'remind', draft: {}, id: 'second' })
    expect(second.history.slice(-2).map((event) => event.id)).toEqual([
      'first',
      'second',
    ])
    expect(second.history.at(-1)?.at).toBe(second.history.at(-2)?.at)
  })
})

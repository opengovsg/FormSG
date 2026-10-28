import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import {
  SubmissionType,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'
import mongoose from 'mongoose'

import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
import { IStepSubmittedEvent } from 'src/types'

import * as WorkflowEventService from '../workflow-event.service'

const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)

const actor = { _id: new ObjectId(), email: 'admin@example.com' }

const createSubmission = (workflowEvents?: Record<string, unknown>[]) =>
  MultirespondentSubmission.create({
    form: new ObjectId(),
    submissionType: SubmissionType.Multirespondent,
    submissionPublicKey: 'public key',
    encryptedSubmissionSecretKey: 'encrypted secret key',
    encryptedContent: 'encrypted content',
    version: 3,
    workflowStep: 0,
    workflowEvents,
  })

const stepSubmitted: IStepSubmittedEvent = {
  type: WorkflowEventType.StepSubmitted,
  outcome: WorkflowStatus.COMPLETED,
  stepNumber: 2,
  emails: ['next@example.com'],
  created: new Date('2026-10-08T00:00:00.000Z'),
  content: {
    encryptedContent: 'encrypted content',
    encryptedSubmissionSecretKey: 'secret key',
    submissionPublicKey: 'public key',
    version: 3,
  },
}

describe('workflow-event.service', () => {
  beforeAll(() => dbHandler.connect())
  beforeEach(() =>
    dbHandler.clearCollection(MultirespondentSubmission.collection.name),
  )
  afterAll(() => dbHandler.closeDatabase())

  describe('recordWorkflowEvent', () => {
    it('appends an event to the submission', async () => {
      const submission = await createSubmission()

      const result = await WorkflowEventService.recordWorkflowEvent({
        submission,
        type: WorkflowEventType.ReminderSent,
        actor,
        stepNumber: 2,
        emails: ['approver@example.com'],
      })

      expect(result.isOk()).toBe(true)
      const saved = await MultirespondentSubmission.findById(submission._id)
      expect(saved?.workflowEvents).toEqual([
        expect.objectContaining({
          type: WorkflowEventType.ReminderSent,
          actorEmail: actor.email,
          stepNumber: 2,
          emails: ['approver@example.com'],
        }),
      ])
    })

    it('keeps the event when a respondent saves a copy loaded before it', async () => {
      const submission = await createSubmission()
      const respondentCopy = await MultirespondentSubmission.findById(
        submission._id,
      )

      await WorkflowEventService.recordWorkflowEvent({
        submission,
        type: WorkflowEventType.ReminderSent,
        actor,
        stepNumber: 2,
        emails: ['approver@example.com'],
      })
      respondentCopy!.submittedSteps = [
        { isApproval: false, submittedAt: new Date().toISOString() },
      ]
      await respondentCopy!.save()

      const saved = await MultirespondentSubmission.findById(submission._id)
      expect(saved?.submittedSteps).toHaveLength(1)
      expect(saved?.workflowEvents).toHaveLength(1)
    })
  })

  describe('workflowEvents schema', () => {
    it('stores a step submission without an actor', async () => {
      const submission = await createSubmission([stepSubmitted])

      const saved = await MultirespondentSubmission.findById(
        submission._id,
      ).lean()
      expect(saved?.workflowEvents).toEqual([stepSubmitted])
    })

    it.each([undefined, WorkflowStatus.PENDING])(
      'rejects a step submission with outcome %s',
      async (outcome) => {
        await expect(
          createSubmission([{ ...stepSubmitted, outcome }]),
        ).rejects.toThrow(mongoose.Error.ValidationError)
      },
    )

    it('rejects an admin event without an actor', async () => {
      await expect(
        createSubmission([
          { ...stepSubmitted, type: WorkflowEventType.AssigneesAdded },
        ]),
      ).rejects.toThrow(mongoose.Error.ValidationError)
    })
  })

  describe('toWorkflowEventDtos', () => {
    it('sends a step submission to admins without an actor', () => {
      expect(
        WorkflowEventService.toWorkflowEventDtos([stepSubmitted]),
      ).toStrictEqual([
        {
          type: WorkflowEventType.StepSubmitted,
          outcome: WorkflowStatus.COMPLETED,
          stepNumber: 2,
          emails: ['next@example.com'],
          created: '2026-10-08T00:00:00.000Z',
        },
      ])
    })

    it('returns the events oldest first', () => {
      const event = {
        actorId: actor._id,
        actorEmail: actor.email,
        stepNumber: 2,
        emails: [],
      }

      const result = WorkflowEventService.toWorkflowEventDtos([
        {
          ...event,
          type: WorkflowEventType.Stopped,
          created: new Date('2026-10-09T00:00:00.000Z'),
        },
        {
          ...event,
          type: WorkflowEventType.ReminderSent,
          created: new Date('2026-10-08T00:00:00.000Z'),
        },
      ])

      expect(result.map(({ type }) => type)).toEqual([
        WorkflowEventType.ReminderSent,
        WorkflowEventType.Stopped,
      ])
    })
  })

  describe('getEventsSinceLastSendBack', () => {
    const event = (type: WorkflowEventType, stepNumber: number) => ({
      type,
      actorId: actor._id,
      actorEmail: actor.email,
      stepNumber,
      emails: [],
      created: new Date(),
    })

    it('keeps only the events after the last send back', () => {
      const afterSendBack = event(WorkflowEventType.ReminderSent, 2)

      const result = WorkflowEventService.getEventsSinceLastSendBack([
        event(WorkflowEventType.ReminderSent, 2),
        event(WorkflowEventType.SentBack, 2),
        afterSendBack,
      ])

      expect(result).toEqual([afterSendBack])
    })

    it('keeps every event when the workflow was never sent back', () => {
      const events = [event(WorkflowEventType.ReminderSent, 2)]

      expect(WorkflowEventService.getEventsSinceLastSendBack(events)).toEqual(
        events,
      )
    })
  })

  describe('toWorkflowEventDtos for a send back', () => {
    it('carries the step it came from and the remarks', () => {
      const [dto] = WorkflowEventService.toWorkflowEventDtos([
        {
          type: WorkflowEventType.SentBack,
          actorId: actor._id,
          actorEmail: actor.email,
          stepNumber: 2,
          fromStepNumber: 3,
          remarks: 'Fix it',
          emails: ['lead@example.com'],
          created: new Date('2026-10-09T00:00:00.000Z'),
        },
      ])

      expect(dto).toMatchObject({
        type: WorkflowEventType.SentBack,
        stepNumber: 2,
        fromStepNumber: 3,
        remarks: 'Fix it',
      })
    })
  })
})

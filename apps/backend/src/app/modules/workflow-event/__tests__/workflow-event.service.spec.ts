import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { SubmissionType, WorkflowEventType } from 'formsg-shared/types'
import mongoose from 'mongoose'

import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'

import * as WorkflowEventService from '../workflow-event.service'

const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)

const actor = { _id: new ObjectId(), email: 'admin@example.com' }

const createSubmission = () =>
  MultirespondentSubmission.create({
    form: new ObjectId(),
    submissionType: SubmissionType.Multirespondent,
    submissionPublicKey: 'public key',
    encryptedSubmissionSecretKey: 'encrypted secret key',
    encryptedContent: 'encrypted content',
    version: 3,
    workflowStep: 0,
  })

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

  describe('toWorkflowEventDtos', () => {
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
    it('carries the step it came from, the remarks and the undone steps', () => {
      const [dto] = WorkflowEventService.toWorkflowEventDtos([
        {
          type: WorkflowEventType.SentBack,
          actorId: actor._id,
          actorEmail: actor.email,
          stepNumber: 2,
          fromStepNumber: 3,
          remarks: 'Fix it',
          undoneSteps: [
            {
              stepNumber: 2,
              submittedAt: '2026-10-08T02:00:00.000Z',
              isApproval: false,
            },
          ],
          emails: ['lead@example.com'],
          created: new Date('2026-10-09T00:00:00.000Z'),
        },
      ])

      expect(dto).toMatchObject({
        type: WorkflowEventType.SentBack,
        stepNumber: 2,
        fromStepNumber: 3,
        remarks: 'Fix it',
        undoneSteps: [{ stepNumber: 2 }],
      })
    })
  })
})

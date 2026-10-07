import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { WorkflowEventType } from 'formsg-shared/types'
import { WORKFLOW_ACTIONS_CUTOFF } from 'formsg-shared/utils/workflow-actions'
import mongoose from 'mongoose'

import getWorkflowEventModel from 'src/app/models/workflow_event.server.model'

import * as WorkflowEventService from '../workflow-event.service'

const WorkflowEvent = getWorkflowEventModel(mongoose)

const actor = { _id: new ObjectId(), email: 'admin@example.com' }

const makeSubmission = (created: Date) => ({
  _id: new ObjectId(),
  form: new ObjectId(),
  created,
})

describe('workflow-event.service', () => {
  beforeAll(() => dbHandler.connect())
  beforeEach(() => dbHandler.clearCollection(WorkflowEvent.collection.name))
  afterAll(() => dbHandler.closeDatabase())

  describe('recordWorkflowEvent', () => {
    it('records an event for a submission on or after the cutoff', async () => {
      const submission = makeSubmission(WORKFLOW_ACTIONS_CUTOFF)

      const result = await WorkflowEventService.recordWorkflowEvent({
        submission,
        type: WorkflowEventType.ReminderSent,
        actor,
        stepNumber: 2,
        emails: ['approver@example.com'],
      })

      expect(result._unsafeUnwrap()).not.toBeNull()
      await expect(
        WorkflowEvent.countDocuments({ submissionId: submission._id }),
      ).resolves.toBe(1)
    })

    it('skips a submission before the cutoff', async () => {
      const submission = makeSubmission(
        new Date(WORKFLOW_ACTIONS_CUTOFF.getTime() - 1),
      )

      const result = await WorkflowEventService.recordWorkflowEvent({
        submission,
        type: WorkflowEventType.ReminderSent,
        actor,
        stepNumber: 2,
        emails: ['approver@example.com'],
      })

      expect(result._unsafeUnwrap()).toBeNull()
      await expect(WorkflowEvent.countDocuments()).resolves.toBe(0)
    })
  })

  describe('getWorkflowEvents', () => {
    it("returns only the submission's events, oldest first", async () => {
      const submission = makeSubmission(WORKFLOW_ACTIONS_CUTOFF)
      const other = makeSubmission(WORKFLOW_ACTIONS_CUTOFF)
      for (const [s, type] of [
        [submission, WorkflowEventType.AssigneesAdded],
        [other, WorkflowEventType.ReminderSent],
        [submission, WorkflowEventType.Stopped],
      ] as const) {
        await WorkflowEventService.recordWorkflowEvent({
          submission: s,
          type,
          actor,
          stepNumber: 2,
          emails: ['a@example.com'],
        })
      }

      const result = await WorkflowEventService.getWorkflowEvents(
        String(submission._id),
      )

      expect(result._unsafeUnwrap()).toEqual([
        expect.objectContaining({
          type: WorkflowEventType.AssigneesAdded,
          submissionId: String(submission._id),
          actorEmail: actor.email,
          stepNumber: 2,
          emails: ['a@example.com'],
        }),
        expect.objectContaining({ type: WorkflowEventType.Stopped }),
      ])
    })
  })
})

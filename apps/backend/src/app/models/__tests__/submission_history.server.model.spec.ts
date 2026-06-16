import { ObjectId } from 'bson'
import mongoose from 'mongoose'

import getSubmissionHistoryModel from 'src/app/models/submission_history.server.model'
import { SubmissionHistorySnapshot } from 'src/types'

import dbHandler from '../../../../__tests__/unit/backend/helpers/jest-db'

const SubmissionHistory = getSubmissionHistoryModel(mongoose)

const makeSnapshot = (
  overrides: Partial<SubmissionHistorySnapshot> = {},
): SubmissionHistorySnapshot => ({
  submissionId: new ObjectId(),
  formId: new ObjectId(),
  submissionIndex: 0,
  workflowStep: 0,
  encryptedContent: 'encrypted-content-string',
  contentFormat: 'v4',
  ...overrides,
})

describe('Submission History Model', () => {
  beforeAll(async () => {
    await dbHandler.connect()
    // Build the unique index so the uniqueness test is deterministic.
    await SubmissionHistory.init()
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('insertSnapshot', () => {
    it('should write exactly one immutable document holding the per-step bits', async () => {
      const snapshot = makeSnapshot({
        submissionIndex: 2,
        workflowStep: 1,
        verifiedContent: 'verified-content-string',
      })

      const inserted = await SubmissionHistory.insertSnapshot(snapshot)

      const all = await SubmissionHistory.find({})
      expect(all).toHaveLength(1)
      expect(String(inserted.submissionId)).toBe(String(snapshot.submissionId))
      expect(String(inserted.formId)).toBe(String(snapshot.formId))
      expect(inserted.submissionIndex).toBe(2)
      expect(inserted.workflowStep).toBe(1)
      expect(inserted.encryptedContent).toBe('encrypted-content-string')
      expect(inserted.contentFormat).toBe('v4')
      expect(inserted.verifiedContent).toBe('verified-content-string')
      expect(inserted.createdAt).toBeInstanceOf(Date)
    })

    it('should enforce uniqueness on { submissionId, submissionIndex }', async () => {
      const submissionId = new ObjectId()
      await SubmissionHistory.insertSnapshot(
        makeSnapshot({ submissionId, submissionIndex: 0 }),
      )

      // Same submission + same index => duplicate, must be rejected.
      await expect(
        SubmissionHistory.insertSnapshot(
          makeSnapshot({ submissionId, submissionIndex: 0 }),
        ),
      ).rejects.toThrow()

      // Same submission, different index => allowed (monotonic per step).
      await expect(
        SubmissionHistory.insertSnapshot(
          makeSnapshot({ submissionId, submissionIndex: 1 }),
        ),
      ).resolves.toBeDefined()
    })
  })

  describe('findBySubmissionIdAndIndex', () => {
    it('should resolve a snapshot by its identity', async () => {
      const submissionId = new ObjectId()
      await SubmissionHistory.insertSnapshot(
        makeSnapshot({ submissionId, submissionIndex: 0, workflowStep: 0 }),
      )
      await SubmissionHistory.insertSnapshot(
        makeSnapshot({ submissionId, submissionIndex: 1, workflowStep: 1 }),
      )

      const found = await SubmissionHistory.findBySubmissionIdAndIndex(
        String(submissionId),
        1,
      )

      expect(found).not.toBeNull()
      expect(found?.workflowStep).toBe(1)
    })

    it('should return null when no snapshot exists for that index', async () => {
      const found = await SubmissionHistory.findBySubmissionIdAndIndex(
        String(new ObjectId()),
        0,
      )
      expect(found).toBeNull()
    })
  })

  describe('atomicity with the step submission', () => {
    it('should not persist the snapshot when the enclosing transaction aborts (failed step writes no snapshot)', async () => {
      const submissionId = new ObjectId()
      const session = await mongoose.startSession()

      await expect(
        session.withTransaction(async () => {
          await SubmissionHistory.insertSnapshot(
            makeSnapshot({ submissionId }),
            { session },
          )
          // Simulate the step submission save failing within the same
          // transaction, which must roll back the snapshot insert too.
          throw new Error('step submission failed')
        }),
      ).rejects.toThrow('step submission failed')

      await session.endSession()

      const all = await SubmissionHistory.find({ submissionId })
      expect(all).toHaveLength(0)
    })

    it('should persist the snapshot when the enclosing transaction commits', async () => {
      const submissionId = new ObjectId()
      const session = await mongoose.startSession()

      await session.withTransaction(async () => {
        await SubmissionHistory.insertSnapshot(makeSnapshot({ submissionId }), {
          session,
        })
      })
      await session.endSession()

      const all = await SubmissionHistory.find({ submissionId })
      expect(all).toHaveLength(1)
    })
  })
})

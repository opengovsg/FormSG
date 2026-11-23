import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import {
  BasicField,
  FormResponseMode,
  LogicConditionState,
  LogicType,
  SubmissionType,
  WorkflowEventType,
  WorkflowType,
} from 'formsg-shared/types'
import mongoose from 'mongoose'

import formsgSdk from 'src/app/config/formsg-sdk'
import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
import { SnapshottedFormDef } from 'src/types/api'
import { MultirespondentSubmissionDto } from 'src/types/api/multirespondent_submission'

import {
  MrfFixChangesWorkflowPathError,
  MrfWorkflowNotPendingError,
} from '../../submission.errors'
import { getEncryptedSubmissionData } from '../../submission.service'
import { checkFixKeepsWorkflowPath, isFixingStep } from '../fix-step'
import {
  addAssigneesToPendingStep,
  getPendingStepAssignees,
  startFixingStep,
  updateMultiRespondentFormSubmission,
} from '../multirespondent-submission.service'
import { createPublicMultirespondentSubmissionDto } from '../multirespondent-submission.utils'
import * as StepToken from '../step-token'

const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)

const formId = new ObjectId()
const actor = { _id: new ObjectId(), email: 'admin@example.com' }
const { publicKey: formPublicKey } = formsgSdk.crypto.generate()

const WORKFLOW = [1, 2, 3, 4].map((n) => ({
  _id: `step-${n}`,
  workflow_type: WorkflowType.Static,
  emails: [`step${n}@example.com`],
  edit: [],
}))

const SUBMITTED_STEPS = [1, 2, 3].map((n) => ({
  isApproval: false,
  submittedAt: `2026-10-08T0${n}:00:00.000Z`,
  nextStepRecipientEmails: [`step${n + 1}@example.com`],
}))

const createSubmission = (overrides: Record<string, unknown> = {}) =>
  MultirespondentSubmission.create({
    form: formId,
    submissionType: SubmissionType.Multirespondent,
    form_fields: [],
    form_logics: [],
    workflow: WORKFLOW,
    submissionPublicKey: 'public-key',
    encryptedSubmissionSecretKey: 'secret-key',
    encryptedContent: 'content',
    version: 3,
    workflowStep: SUBMITTED_STEPS.length - 1,
    submittedSteps: SUBMITTED_STEPS,
    stepTokenHash: StepToken.hash('old-token'),
    ...overrides,
  })

const fixStep = (
  submissionId: unknown,
  targetStepNumber: number,
  clearResponses = false,
) =>
  startFixingStep({
    formId: String(formId),
    formPublicKey,
    submissionId: String(submissionId),
    targetStepNumber,
    expectedStepNumber: 4,
    remarks: 'Wrong date',
    canFixStepOne: true,
    clearResponses,
    actor,
  })

describe('fix step', () => {
  beforeAll(() => dbHandler.connect())
  beforeEach(() =>
    dbHandler.clearCollection(MultirespondentSubmission.collection.name),
  )
  afterAll(() => dbHandler.closeDatabase())

  describe('startFixingStep', () => {
    it('clears only target-step prefills and preserves stored answers, attachments, and approvals', async () => {
      const fieldIds = [1, 2, 3, 4].map(() => String(new ObjectId()))
      const submission = await createSubmission({
        workflow: WORKFLOW.map((step, index) => ({
          ...step,
          edit: [fieldIds[index]],
        })),
        attachmentMetadata: { [fieldIds[1]]: 'attachment-key' },
      })
      const result = await fixStep(submission._id, 2, true)
      expect(result.isOk()).toBe(true)
      const stored = await MultirespondentSubmission.findById(submission._id)
      expect(stored?.correctionClearFieldIds).toEqual([fieldIds[1]])
      expect(
        createPublicMultirespondentSubmissionDto(stored!, {})
          .correctionClearFieldIds,
      ).toEqual([fieldIds[1]])
      const publicData = (
        await getEncryptedSubmissionData(
          FormResponseMode.Multirespondent,
          String(formId),
          String(submission._id),
        )
      )._unsafeUnwrap()
      if (publicData.submissionType !== SubmissionType.Multirespondent)
        throw new Error('Expected multirespondent fixture')
      expect(
        createPublicMultirespondentSubmissionDto(publicData, {})
          .correctionClearFieldIds,
      ).toEqual([fieldIds[1]])
      expect(stored?.encryptedContent).toBe('content')
      expect(stored?.attachmentMetadata?.get(fieldIds[1])).toBe(
        'attachment-key',
      )
      expect(JSON.stringify(stored?.submittedSteps)).toEqual(
        JSON.stringify(submission.submittedSteps),
      )
    })

    it('reopens the step without undoing the steps after it', async () => {
      const submission = await createSubmission()

      const result = await fixStep(submission._id, 2)

      expect(result._unsafeUnwrap()).toEqual({
        stepNumber: 2,
        emails: ['step2@example.com'],
        stepToken: expect.any(String),
      })
      const stored = await MultirespondentSubmission.findById(submission._id)
      expect(stored?.submittedSteps).toHaveLength(3)
      expect(stored?.workflowStep).toBe(0)
      expect(isFixingStep(stored!)).toBe(true)
      expect(StepToken.verify('old-token', stored!.stepTokenHash!)).toBe(false)
      expect(stored?.workflowEvents.at(-1)).toMatchObject({
        type: WorkflowEventType.FixStep,
        stepNumber: 2,
        fromStepNumber: 4,
        emails: ['step2@example.com'],
        remarks: 'Wrong date',
      })
    })

    it('refuses a second fix while one is open', async () => {
      const submission = await createSubmission()
      await fixStep(submission._id, 2)

      const result = await fixStep(submission._id, 3)

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        MrfWorkflowNotPendingError,
      )
    })

    it('refuses to add people to the pending step during a fix', async () => {
      const submission = await createSubmission()
      await fixStep(submission._id, 2)

      const result = await addAssigneesToPendingStep({
        formId: String(formId),
        submissionId: String(submission._id),
        emails: ['new@example.com'],
        expectedStepNumber: 4,
        actor,
      })

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        MrfWorkflowNotPendingError,
      )
    })
  })

  describe('submitting the fixed step', () => {
    const snapshottedFormDef = {
      _id: formId,
      title: 'Test form',
      form_fields: [],
      form_logics: [],
      workflow: WORKFLOW,
    } as unknown as SnapshottedFormDef

    const payload = (
      overrides: Partial<MultirespondentSubmissionDto> = {},
    ): MultirespondentSubmissionDto => ({
      submissionPublicKey: 'new-public-key',
      encryptedSubmissionSecretKey: 'new-secret-key',
      encryptedContent: 'fixed-content',
      submissionSecretKey: 'submission-secret-key',
      version: 3,
      workflowStep: 1,
      responses: {},
      mrfVersion: 2,
      stepTokenHash: StepToken.hash('return-token'),
      encryptedStepToken: 'wrapped-return-token',
      ...overrides,
    })

    it('saves the answers and returns to the pending step', async () => {
      const submission = await createSubmission()
      await fixStep(submission._id, 2, true)
      const fixing = await MultirespondentSubmission.findById(submission._id)

      const result = await updateMultiRespondentFormSubmission({
        submissionId: String(submission._id),
        snapshottedFormDef,
        encryptedPayload: payload(),
        expectedPrevious: {
          workflowStep: fixing!.workflowStep,
          stepTokenHash: fixing!.stepTokenHash,
        },
        logMeta: {},
      })

      expect(result.isOk()).toBe(true)
      const stored = await MultirespondentSubmission.findById(submission._id)
      expect(stored?.encryptedContent).toBe('fixed-content')
      expect(stored?.workflowStep).toBe(2)
      expect(stored?.correctionClearFieldIds).toBeUndefined()
      expect(stored?.submittedSteps).toHaveLength(3)
      expect(isFixingStep(stored!)).toBe(false)
      expect(StepToken.verify('return-token', stored!.stepTokenHash!)).toBe(
        true,
      )
      expect(stored?.workflowEvents.at(-1)).toMatchObject({
        type: WorkflowEventType.StepSubmitted,
        stepNumber: 2,
        emails: [],
      })
      expect(getPendingStepAssignees(stored!)).toEqual(['step4@example.com'])
    })
  })

  describe('checkFixKeepsWorkflowPath', () => {
    const [ownField, routingField, gateField, gatedField] = [1, 2, 3, 4].map(
      () => String(new ObjectId()),
    )
    const form = {
      _id: String(formId),
      form_fields: [ownField, routingField, gateField, gatedField].map(
        (_id) => ({
          _id,
          fieldType:
            _id === gateField ? BasicField.YesNo : BasicField.ShortText,
          title: _id,
        }),
      ),
      form_logics: [
        {
          _id: 'logic',
          logicType: LogicType.ShowFields,
          conditions: [
            {
              field: gateField,
              state: LogicConditionState.Equal,
              value: 'Yes',
            },
          ],
          show: [gatedField],
        },
      ],
      workflow: [
        { workflow_type: WorkflowType.Static, emails: [], edit: [] },
        {
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [ownField, routingField, gateField],
        },
        {
          workflow_type: WorkflowType.Dynamic,
          field: routingField,
          edit: [gatedField],
        },
      ],
    } as unknown as Parameters<typeof checkFixKeepsWorkflowPath>[0]['form']
    const answer = (value: string, fieldType = BasicField.ShortText) => ({
      fieldType,
      answer: { value },
    })
    const previousResponses = {
      [ownField]: answer('old'),
      [routingField]: answer('lead@example.com'),
      [gateField]: answer('No', BasicField.YesNo),
    } as never

    const check = (changes: Record<string, unknown>) =>
      checkFixKeepsWorkflowPath({
        form,
        workflowStep: 1,
        previousResponses,
        responses: { ...(previousResponses as object), ...changes } as never,
      })

    it('allows changes that keep the path', () => {
      expect(check({ [ownField]: answer('new') }).isOk()).toBe(true)
    })

    it('blocks changing who a later step goes to', () => {
      expect(
        check({
          [routingField]: answer('other@example.com'),
        })._unsafeUnwrapErr(),
      ).toBeInstanceOf(MrfFixChangesWorkflowPathError)
    })

    it('blocks showing a question a later step answers', () => {
      expect(
        check({
          [gateField]: answer('Yes', BasicField.YesNo),
        })._unsafeUnwrapErr(),
      ).toBeInstanceOf(MrfFixChangesWorkflowPathError)
    })
  })
})

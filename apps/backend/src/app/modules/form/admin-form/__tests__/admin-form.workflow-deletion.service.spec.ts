import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { FormResponseMode, FormStatus, WorkflowType } from 'formsg-shared/types'
import { merge } from 'lodash'
import mongoose from 'mongoose'

import getFormModel, {
  getMultirespondentFormModel,
} from 'src/app/models/form.server.model'
import {
  FormInvalidResponseModeError,
  FormOpenToResponsesError,
} from 'src/app/modules/form/form.errors'
import { IPopulatedForm, IPopulatedUser } from 'src/types'

import {
  deleteFormWorkflow,
  deleteFormWorkflowStep,
} from '../admin-form.service'

const FormModel = getFormModel(mongoose)
const MultirespondentFormModel = getMultirespondentFormModel(mongoose)

const MOCK_ADMIN_ID = new ObjectId().toHexString()

const step = (email: string) => ({
  _id: new ObjectId(),
  workflow_type: WorkflowType.Static,
  emails: [email],
  edit: [],
})

/**
 * Deleting a workflow is unrecoverable and total, so these cover the two things
 * that stop it happening by accident: the form has to be closed first, and
 * deleting step 1 has to mean this rather than silently promoting step 2.
 */
describe('workflow deletion', () => {
  let populatedAdmin: IPopulatedUser

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    const preloaded = await dbHandler.insertFormCollectionReqs({
      userId: MOCK_ADMIN_ID,
    })
    populatedAdmin = merge(preloaded.user, {
      agency: preloaded.agency,
    }) as IPopulatedUser
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  const createMrfForm = async (status: FormStatus, stepCount = 3) => {
    const form = await MultirespondentFormModel.create({
      title: 'mrf with a workflow',
      admin: populatedAdmin._id,
      responseMode: FormResponseMode.Multirespondent,
      publicKey: 'mock-public-key',
      status,
      workflow: Array.from({ length: stepCount }, (_, i) =>
        step(`step${i}@example.com`),
      ),
    })
    return merge(form, { admin: populatedAdmin }) as unknown as IPopulatedForm
  }

  describe('deleteFormWorkflow', () => {
    it('should clear every step, not only the first', async () => {
      const form = await createMrfForm(FormStatus.Private)

      const actual = await deleteFormWorkflow(form)

      expect(actual._unsafeUnwrap()).toEqual([])
      const stored = await FormModel.findById(form._id)
      expect((stored as never as { workflow: unknown[] }).workflow).toEqual([])
    })

    // Respondents may be part-way through a workflow right now, and pulling it
    // out from under them mid-submission is not something an admin can undo.
    it('should refuse while the form is open to responses', async () => {
      const form = await createMrfForm(FormStatus.Public)

      const actual = await deleteFormWorkflow(form)

      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(FormOpenToResponsesError)
      const stored = await FormModel.findById(form._id)
      expect(
        (stored as never as { workflow: unknown[] }).workflow,
      ).toHaveLength(3)
    })

    it.each([FormStatus.Private, FormStatus.Archived])(
      'should allow deletion when the form is %s',
      async (status) => {
        const form = await createMrfForm(status)

        const actual = await deleteFormWorkflow(form)

        expect(actual._unsafeUnwrap()).toEqual([])
      },
    )

    it('should refuse for a form that is not multi-respondent', async () => {
      const form = await createMrfForm(FormStatus.Private)
      const notMrf = merge({}, form, {
        responseMode: FormResponseMode.Encrypt,
      }) as IPopulatedForm

      const actual = await deleteFormWorkflow(notMrf)

      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(
        FormInvalidResponseModeError,
      )
    })

    it('should be a no-op rather than an error on an empty workflow', async () => {
      const form = await createMrfForm(FormStatus.Private, 0)

      const actual = await deleteFormWorkflow(form)

      expect(actual._unsafeUnwrap()).toEqual([])
    })
  })

  // Refusing to delete step 1 is flagged behaviour and lives in the controller,
  // where the flag can be read; it is covered by the route spec.
  describe('deleteFormWorkflowStep', () => {
    it('should still delete a later step', async () => {
      const form = await createMrfForm(FormStatus.Private)

      const actual = await deleteFormWorkflowStep(form, 1)

      expect(actual._unsafeUnwrap()).toHaveLength(2)
    })

    // Unlike deleting the workflow, shortening one is recoverable by adding the
    // step back, so it is not gated on the form being closed.
    it('should delete a later step even while the form is open', async () => {
      const form = await createMrfForm(FormStatus.Public)

      const actual = await deleteFormWorkflowStep(form, 1)

      expect(actual._unsafeUnwrap()).toHaveLength(2)
    })
  })
})

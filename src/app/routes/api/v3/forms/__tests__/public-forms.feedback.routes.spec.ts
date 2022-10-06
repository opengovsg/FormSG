import { ObjectId } from 'mongodb'
import { errAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import {
  DuplicateFeedbackSubmissionError,
  InvalidSubmissionIdError,
} from 'src/app/modules/feedback/feedback.errors'

import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { FormStatus } from '../../../../../../../shared/types'
import * as FormService from '../../../../../modules/form/form.service'
import { PublicFormsRouter } from '../public-forms.routes'

const app = setupApp('/forms', PublicFormsRouter)

// Avoid async refresh calls
jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')

/**
 * TODO #3964: Remove 'public-form.feedback.routes' test, and keep 'public-form.submissions.feedback.routes' test
 * once `/api/v3/forms/{formId}/feedback` route is cleaned up
 */
describe('public-form.feedback.routes', () => {
  let request: Session

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('POST /forms/:formId/submissions/:submissionId/feedback', () => {
    it('should return 200 when feedback was successfully saved', async () => {
      const MOCK_FEEDBACK = {
        rating: 5,
        comment: 'great mock',
      }

      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          status: FormStatus.Public,
        },
      })
      const { submission } = await dbHandler.insertFormSubmission({
        formId: form._id,
      })

      const expectedResp = JSON.parse(
        JSON.stringify({ message: 'Successfully submitted feedback' }),
      )
      const actualResp = await request
        .post(`/forms/${form._id}/submissions/${submission._id}/feedback`)
        .send(MOCK_FEEDBACK)

      expect(actualResp.status).toEqual(200)
      expect(actualResp.body).toEqual(expectedResp)
    })

    it('should return 400 when form feedback submitted is malformed', async () => {
      const MOCK_FEEDBACK = { rating: 6 }

      const { form } = await dbHandler.insertEmailForm()
      const { submission } = await dbHandler.insertFormSubmission({
        formId: form._id,
      })

      const actualResp = await request
        .post(`/forms/${form._id}/submissions/${submission._id}/feedback`)
        .send(MOCK_FEEDBACK)

      expect(actualResp.status).toEqual(400)
      expect(actualResp.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'rating',
            message: '"rating" must be less than or equal to 5',
          },
        }),
      )
    })

    it('should return 404 when form is private', async () => {
      const MOCK_FEEDBACK = {
        rating: 5,
        comment: 'great mock',
      }

      const { form } = await dbHandler.insertEmailForm()
      const { submission } = await dbHandler.insertFormSubmission({
        formId: form._id,
      })
      const expectedResp = JSON.parse(
        JSON.stringify({
          message: form.inactiveMessage,
          formTitle: form.title,
          isPageFound: true,
        }),
      )

      const actualResp = await request
        .post(`/forms/${form._id}/submissions/${submission._id}/feedback`)
        .send(MOCK_FEEDBACK)

      expect(actualResp.status).toEqual(404)
      expect(actualResp.body).toEqual(expectedResp)
    })

    it('should return 404 when submissionId does not exist', async () => {
      const MOCK_FEEDBACK = {
        rating: 5,
        comment: 'great mock',
      }

      const { form } = await dbHandler.insertEmailForm()
      const expectedResp = JSON.parse(
        JSON.stringify({
          message: new InvalidSubmissionIdError().message,
        }),
      )

      const INVALID_SUBMISSION_ID = new ObjectId().toHexString()
      const actualResp = await request
        .post(
          `/forms/${form._id}/submissions/${INVALID_SUBMISSION_ID}/feedback`,
        )
        .send(MOCK_FEEDBACK)

      expect(actualResp.status).toEqual(404)
      expect(actualResp.body).toEqual(expectedResp)
    })

    it('should return 422 when form feedback for the submissionId has already been submitted', async () => {
      const MOCK_FEEDBACK = {
        rating: 5,
        comment: 'great mock',
      }

      const { form } = await dbHandler.insertEmailForm()
      const { submission } = await dbHandler.insertFormSubmission({
        formId: form._id,
      })
      await dbHandler.insertFormFeedback({
        formId: form._id,
        submissionId: submission._id,
      })

      const expectedResp = JSON.parse(
        JSON.stringify({
          message: new DuplicateFeedbackSubmissionError().message,
        }),
      )
      const actualResp = await request
        .post(`/forms/${form._id}/submissions/${submission._id}/feedback`)
        .send(MOCK_FEEDBACK)

      expect(actualResp.status).toEqual(422)
      expect(actualResp.body).toEqual(expectedResp)
    })

    it('should return 410 when form is archived', async () => {
      const MOCK_FEEDBACK = {
        rating: 5,
        comment: 'great mock',
      }

      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          status: FormStatus.Archived,
        },
      })
      const { submission } = await dbHandler.insertFormSubmission({
        formId: form._id,
      })

      const expectedResp = JSON.parse(
        JSON.stringify({
          message:
            'This form has been deleted, so feedback submissions are no longer accepted',
        }),
      )

      const actualResp = await request
        .post(`/forms/${form._id}/submissions/${submission._id}/feedback`)
        .send(MOCK_FEEDBACK)

      expect(actualResp.status).toEqual(410)
      expect(actualResp.body).toEqual(expectedResp)
    })

    it('should return 500 when form could not be retrieved due to a database error', async () => {
      const MOCK_ERROR_MESSAGE =
        'Sorry, something went wrong. Please refresh and try again.'
      const MOCK_FEEDBACK = {
        rating: 5,
        comment: 'great mock',
      }

      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          status: FormStatus.Public,
        },
      })
      const { submission } = await dbHandler.insertFormSubmission({
        formId: form._id,
      })

      const expectedResp = JSON.parse(
        JSON.stringify({
          message: MOCK_ERROR_MESSAGE,
        }),
      )
      jest
        .spyOn(FormService, 'retrieveFullFormById')
        .mockReturnValueOnce(errAsync(new DatabaseError(MOCK_ERROR_MESSAGE)))

      const actualResp = await request
        .post(`/forms/${form._id}/submissions/${submission._id}/feedback`)
        .send(MOCK_FEEDBACK)

      expect(actualResp.status).toEqual(500)
      expect(actualResp.body).toEqual(expectedResp)
    })
  })
})

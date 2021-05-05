import { getReasonPhrase, StatusCodes } from 'http-status-codes'
import { errAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import { DatabaseError } from 'src/modules/core/core.errors'
import { Status } from 'src/types'

import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import * as FormService from '../../../../../modules/form/form.service'
import { PublicFormsRouter } from '../public-forms.routes'

const app = setupApp('/forms', PublicFormsRouter)

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
  describe('POST /forms/:formId/feedback', () => {
    it('should return 200 when feedback was successfully saved', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          status: Status.Public,
        },
      })
      const MOCK_FEEDBACK = {
        rating: 5,
        comment: 'great mock',
      }
      const expectedResponse = JSON.parse(
        JSON.stringify({ message: 'Successfully submitted feedback' }),
      )

      // Act
      const response = await request
        .post(`/forms/${form._id}/feedback`)
        .send(MOCK_FEEDBACK)

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 400 when form feedback submitted is malformed', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm()
      const MOCK_FEEDBACK = { rating: 6 }

      // Act
      const response = await request
        .post(`/forms/${form._id}/feedback`)
        .send(MOCK_FEEDBACK)

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'rating',
            message: '"rating" must be less than or equal to 5',
          },
        }),
      )
    })

    it('should return 404 when form is private', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm()
      const MOCK_FEEDBACK = {
        rating: 5,
        comment: 'great mock',
      }
      const expectedResponse = JSON.parse(
        JSON.stringify({
          message: form.inactiveMessage,
          formTitle: form.title,
          isPageFound: true,
        }),
      )

      // Act
      const response = await request
        .post(`/forms/${form._id}/feedback`)
        .send(MOCK_FEEDBACK)

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 410 when form is archived', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          status: Status.Archived,
        },
      })
      const MOCK_FEEDBACK = {
        rating: 5,
        comment: 'great mock',
      }
      const expectedResponse = JSON.parse(
        JSON.stringify({
          message: getReasonPhrase(StatusCodes.GONE),
        }),
      )

      // Act
      const response = await request
        .post(`/forms/${form._id}/feedback`)
        .send(MOCK_FEEDBACK)

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 500 when form could not be retrieved due to a database error', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          status: Status.Public,
        },
      })
      const MOCK_ERROR_MESSAGE = 'mock me'
      const MOCK_FEEDBACK = {
        rating: 5,
        comment: 'great mock',
      }
      const expectedResponse = JSON.parse(
        JSON.stringify({
          message: MOCK_ERROR_MESSAGE,
        }),
      )
      jest
        .spyOn(FormService, 'retrieveFullFormById')
        .mockReturnValueOnce(errAsync(new DatabaseError(MOCK_ERROR_MESSAGE)))

      // Act
      const response = await request
        .post(`/forms/${form._id}/feedback`)
        .send(MOCK_FEEDBACK)

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual(expectedResponse)
    })
  })
})

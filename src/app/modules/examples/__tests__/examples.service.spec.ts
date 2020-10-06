import { ObjectId } from 'bson-ext'
import { flatten, times } from 'lodash'
import mongoose from 'mongoose'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import getFormFeedbackModel from 'src/app/models/form_feedback.server.model'
import getFormStatisticsTotalModel from 'src/app/models/form_statistics_total.server.model'
import getFormModel from 'src/app/models/form.server.model'
import getSubmissionModel from 'src/app/models/submission.server.model'
import {
  IAgencySchema,
  IFormFeedbackSchema,
  IFormSchema,
  IUserSchema,
  ResponseMode,
  Status,
  SubmissionType,
} from 'src/types'

import { PAGE_SIZE } from '../examples.constants'
import { ResultsNotFoundError } from '../examples.errors'
import * as ExamplesService from '../examples.service'
import { FormInfo, RetrievalType } from '../examples.types'

const FormStatsModel = getFormStatisticsTotalModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)
const FormModel = getFormModel(mongoose)
const FeedbackModel = getFormFeedbackModel(mongoose)

// Mock min sub count so anything above 0 submissions will be counted.
jest.mock('../examples.constants', () => ({
  PAGE_SIZE: 16,
  MIN_SUB_COUNT: 0,
}))

type TestData = {
  [section: string]: {
    searchTerm: string
    // Number of forms with title containing key.
    formCount: number
    // Number of times the form was submitted.
    submissionCount: number
    // The forms themselves.
    forms: IFormSchema[]
    // Expected form info to be returned by query.
    expectedFormInfo: FormInfo[]
    // Feedbacks for each of the forms.
    feedbacks: IFormFeedbackSchema[]
  }
}

describe('examples.service', () => {
  const INVALID_SEARCH_TERM = 'invalidsearchterm'
  let testData: TestData

  beforeAll(async () => {
    await dbHandler.connect()
    const { user, agency } = await dbHandler.insertFormCollectionReqs()
    testData = await prepareTestData(user, agency)
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('getExampleForms', () => {
    describe('with RetrievalType.Stats', () => {
      const getExampleFormsUsingStats = ExamplesService.getExampleForms(
        RetrievalType.Stats,
      )

      describe('when query.searchTerm exists', () => {
        describe('when query.shouldGetTotalNumResults is true', () => {
          it('should return list of form info that match the search term with results count', async () => {
            // Act
            const actualResults = await getExampleFormsUsingStats({
              searchTerm: testData.second.searchTerm,
              pageNo: '0',
              shouldGetTotalNumResults: 'true',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              totalNumResults: testData.second.formCount,
              forms: expect.arrayContaining(testData.second.expectedFormInfo),
            })
          })

          it('should return empty list if no forms match search term with 0 result count', async () => {
            // Act
            const actualResults = await getExampleFormsUsingStats({
              searchTerm: INVALID_SEARCH_TERM,
              pageNo: '0',
              shouldGetTotalNumResults: 'true',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              forms: [],
              totalNumResults: 0,
            })
          })
        })

        describe('when query.shouldGetTotalNumResults is false', () => {
          it('should return only list of form info that match the search term', async () => {
            // Act
            const actualResults = await getExampleFormsUsingStats({
              searchTerm: testData.first.searchTerm,
              pageNo: '0',
              shouldGetTotalNumResults: 'false',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              forms: expect.arrayContaining(testData.first.expectedFormInfo),
            })
          })

          it('should return empty list if no forms match search term', async () => {
            // Act
            const actualResults = await getExampleFormsUsingStats({
              searchTerm: INVALID_SEARCH_TERM,
              pageNo: '0',
              shouldGetTotalNumResults: 'false',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              forms: [],
            })
          })
        })
      })

      describe('when query.searchTerm does not exist', () => {
        describe('when query.shouldGetTotalNumResults is true', () => {
          it('should return list of form info with results count', async () => {
            // Act
            const actualResults = await getExampleFormsUsingStats({
              pageNo: '0',
              shouldGetTotalNumResults: 'true',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              totalNumResults: testData.total.formCount,
              forms: expect.arrayContaining(testData.total.expectedFormInfo),
            })
          })

          it('should return empty list with number of forms with submissions when offset is more than number of documents in collection', async () => {
            // Arrange
            const overOffset = String(
              (await FormStatsModel.estimatedDocumentCount()) / PAGE_SIZE + 1,
            )
            // Act
            const actualResults = await getExampleFormsUsingStats({
              pageNo: overOffset,
              shouldGetTotalNumResults: 'true',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              forms: [],
              totalNumResults: testData.total.formCount,
            })
          })
        })

        describe('when query.shouldGetTotalNumResults is false', () => {
          it('should return list of form info', async () => {
            // Act
            const actualResults = await getExampleFormsUsingStats({
              pageNo: '0',
              shouldGetTotalNumResults: 'false',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              forms: expect.arrayContaining(testData.total.expectedFormInfo),
            })
          })

          it('should return empty list when offset is more than number of documents', async () => {
            // Arrange
            const overOffset = String(
              (await FormStatsModel.estimatedDocumentCount()) / PAGE_SIZE + 1,
            )
            // Act
            const actualResults = await getExampleFormsUsingStats({
              pageNo: overOffset,
              shouldGetTotalNumResults: 'false',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              forms: [],
            })
          })
        })
      })
    })

    describe('with RetrievalType.Submissions', () => {
      const getExampleFormsUsingSubs = ExamplesService.getExampleForms(
        RetrievalType.Submissions,
      )

      describe('when query.searchTerm exists', () => {
        describe('when query.shouldGetTotalNumResults is true', () => {
          it('should return list of form info that match the search term with results count', async () => {
            // Act
            const actualResults = await getExampleFormsUsingSubs({
              searchTerm: testData.second.searchTerm,
              pageNo: '0',
              shouldGetTotalNumResults: 'true',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              totalNumResults: testData.second.formCount,
              forms: expect.arrayContaining(testData.second.expectedFormInfo),
            })
          })

          it('should return empty list if no forms match search term with 0 result count', async () => {
            // Act
            const actualResults = await getExampleFormsUsingSubs({
              searchTerm: INVALID_SEARCH_TERM,
              pageNo: '0',
              shouldGetTotalNumResults: 'true',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              forms: [],
              totalNumResults: 0,
            })
          })
        })

        describe('when query.shouldGetTotalNumResults is false', () => {
          it('should return only list of form info that match the search term', async () => {
            // Act
            const actualResults = await getExampleFormsUsingSubs({
              searchTerm: testData.first.searchTerm,
              pageNo: '0',
              shouldGetTotalNumResults: 'false',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap().forms).toEqual(
              expect.arrayContaining(testData.first.expectedFormInfo),
            )
          })

          it('should return empty list if no forms match search term', async () => {
            // Act
            const actualResults = await getExampleFormsUsingSubs({
              searchTerm: INVALID_SEARCH_TERM,
              pageNo: '0',
              shouldGetTotalNumResults: 'false',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              forms: [],
            })
          })
        })
      })

      describe('when query.searchTerm does not exist', () => {
        describe('when query.shouldGetTotalNumResults is true', () => {
          it('should return list of form info with results count', async () => {
            // Act
            const actualResults = await getExampleFormsUsingSubs({
              pageNo: '0',
              shouldGetTotalNumResults: 'true',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              totalNumResults: testData.total.formCount,
              forms: expect.arrayContaining(testData.total.expectedFormInfo),
            })
          })

          it('should return empty list with total number of submissions when offset is more than number of documents in collection', async () => {
            // Arrange
            const overOffset = String(
              (await SubmissionModel.estimatedDocumentCount()) / PAGE_SIZE + 1,
            )
            // Act
            const actualResults = await getExampleFormsUsingSubs({
              pageNo: overOffset,
              shouldGetTotalNumResults: 'true',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              forms: [],
              totalNumResults: testData.total.formCount,
            })
          })
        })

        describe('when query.shouldGetTotalNumResults is false', () => {
          it('should return only list of form info', async () => {
            // Act
            const actualResults = await getExampleFormsUsingSubs({
              pageNo: '0',
              shouldGetTotalNumResults: 'false',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            // Return should be all forms
            expect(actualResults._unsafeUnwrap()).toEqual({
              forms: expect.arrayContaining(testData.total.expectedFormInfo),
            })
          })

          it('should return empty list when offset is more than number of documents', async () => {
            // Arrange
            const overOffset = String(
              (await FormStatsModel.estimatedDocumentCount()) / PAGE_SIZE + 1,
            )
            // Act
            const actualResults = await getExampleFormsUsingSubs({
              pageNo: overOffset,
              shouldGetTotalNumResults: 'false',
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              forms: [],
            })
          })
        })
      })
    })
  })

  describe('getSingleExampleForm', () => {
    describe('with RetrievalType.Stats', () => {
      const getSingleFormUsingSubs = ExamplesService.getSingleExampleForm(
        RetrievalType.Submissions,
      )

      it('should return form info of given formId when form exists in the database', async () => {
        // Arrange
        const expectedFormInfo = testData.first.expectedFormInfo[0]

        // Act
        const actualResults = await getSingleFormUsingSubs(expectedFormInfo._id)

        // Assert
        expect(actualResults.isOk()).toEqual(true)
        expect(actualResults._unsafeUnwrap()).toEqual({
          form: expectedFormInfo,
        })
      })

      it('should return ResultsNotFoundError when form does not exist in the database', async () => {
        // Act
        const actualResults = await getSingleFormUsingSubs(
          String(new ObjectId()),
        )

        // Assert
        expect(actualResults.isErr()).toEqual(true)
        expect(actualResults._unsafeUnwrapErr()).toBeInstanceOf(
          ResultsNotFoundError,
        )
      })
    })

    describe('with RetrievalType.Submissions', () => {
      const getSingleFormUsingStats = ExamplesService.getSingleExampleForm(
        RetrievalType.Stats,
      )
      it('should return form info of given formId when form exists in the database', async () => {
        // Arrange
        const expectedFormInfo = testData.second.expectedFormInfo[1]

        // Act
        const actualResults = await getSingleFormUsingStats(
          expectedFormInfo._id,
        )

        // Assert
        expect(actualResults.isOk()).toEqual(true)
        expect(actualResults._unsafeUnwrap()).toEqual({
          form: expectedFormInfo,
        })
      })

      it('should return ResultsNotFoundError when form does not exist in the database', async () => {
        // Act
        const actualResults = await getSingleFormUsingStats(
          String(new ObjectId()),
        )

        // Assert
        expect(actualResults.isErr()).toEqual(true)
        expect(actualResults._unsafeUnwrapErr()).toBeInstanceOf(
          ResultsNotFoundError,
        )
      })
    })
  })
})

const prepareTestData = async (
  user: IUserSchema,
  agency: IAgencySchema,
): Promise<TestData> => {
  const testData: TestData = {
    first: {
      searchTerm: 'first',
      formCount: 2,
      submissionCount: 3,
      forms: [],
      expectedFormInfo: [],
      feedbacks: [],
    },
    second: {
      searchTerm: 'second',
      formCount: 3,
      submissionCount: 5,
      forms: [],
      expectedFormInfo: [],
      feedbacks: [],
    },
    total: {
      searchTerm: '',
      formCount: 5,
      submissionCount: 8,
      forms: [],
      expectedFormInfo: [],
      feedbacks: [],
    },
  }

  const baseFormParams = {
    admin: user._id,
    responseMode: ResponseMode.Email,
    emails: [user.email],
    // Important for form status to be public and listed so examples can
    // surface.
    status: Status.Public,
    isListed: true,
  }

  // Populate forms in database with prespecified number of times.
  const firstFormsPromises = times(testData.first.formCount, () =>
    FormModel.create({
      ...baseFormParams,
      title: `${testData.first.searchTerm} ${Math.random()}`,
    }),
  )

  testData.first.forms = await Promise.all(firstFormsPromises)

  const secondFormsPromises = times(testData.second.formCount, () =>
    FormModel.create({
      ...baseFormParams,
      title: `${testData.second.searchTerm} ${Math.random()}`,
    }),
  )

  testData.second.forms = await Promise.all(secondFormsPromises)

  // Add submissions to all forms with the prespecified number of submissions.
  const firstSubmissionPromises = flatten(
    testData.first.forms.map((form) =>
      times(testData.first.submissionCount, () =>
        SubmissionModel.create({
          form: form._id,
          submissionType: SubmissionType.Email,
          responseSalt: 'some salt',
          responseHash: 'some hash',
        }),
      ),
    ),
  )
  const secondSubmissionPromises = flatten(
    testData.second.forms.map((form) =>
      times(testData.second.submissionCount, () =>
        SubmissionModel.create({
          form: form._id,
          submissionType: SubmissionType.Email,
          responseSalt: 'some salt',
          responseHash: 'some hash',
        }),
      ),
    ),
  )

  // Assign all forms in test data.
  testData.total.forms = testData.first.forms.concat(testData.second.forms)

  // Add form statistics for "submissions" for both form prefixes.
  const formStatsPromises = testData.first.forms
    .map((form) =>
      FormStatsModel.create({
        lastSubmission: new Date(),
        totalCount: testData.first.submissionCount,
        formId: form._id,
      }),
    )
    .concat(
      testData.second.forms.map((form) =>
        FormStatsModel.create({
          lastSubmission: new Date(),
          totalCount: testData.second.submissionCount,
          formId: form._id,
        }),
      ),
    )

  // Function to generate random number between min and max.
  const randomNumber = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  // Generate random feedback scores for all forms.
  const feedbackScores = times(testData.total.forms.length, () =>
    randomNumber(1, 5),
  )

  // Populate feedback collection with generated feedback scores.
  const feedbackPromises = feedbackScores.map((score, i) => {
    return FeedbackModel.create({
      rating: score,
      formId: testData.total.forms[i]._id,
    })
  })

  await Promise.all(firstSubmissionPromises.concat(secondSubmissionPromises))
  await Promise.all(formStatsPromises)
  const feedbacks = await Promise.all(feedbackPromises)

  // Assign all feedbacks into test data.
  testData.total.feedbacks = feedbacks
  testData.first.feedbacks = feedbacks.slice(0, testData.first.forms.length + 1)
  testData.second.feedbacks = feedbacks.slice(testData.first.forms.length)

  // Internal function to create expected aggregate pipeline results to insert
  // into test data.
  const createFormInfo = (
    forms: IFormSchema[],
    titlePrefix: 'first' | 'second',
  ): FormInfo[] => {
    const isFirst = titlePrefix === 'first'
    return forms.map((form, i) => ({
      _id: form._id,
      agency: agency.shortName,
      avgFeedback: isFirst
        ? testData.first.feedbacks[i].rating
        : testData.second.feedbacks[i].rating,
      colorTheme: form.startPage!.colorTheme,
      count: isFirst
        ? testData.first.submissionCount
        : testData.second.submissionCount,
      form_fields: [],
      logo: agency.logo,
      timeText: 'less than 1 day ago',
      lastSubmission: expect.anything(),
      title: form.title,
    }))
  }

  // Create expected results from running example aggregate pipelines.
  testData.first.expectedFormInfo = createFormInfo(
    testData.first.forms,
    'first',
  )
  testData.second.expectedFormInfo = createFormInfo(
    testData.second.forms,
    'second',
  )

  testData.total.expectedFormInfo = testData.first.expectedFormInfo.concat(
    testData.second.expectedFormInfo,
  )

  return testData
}

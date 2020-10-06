import { times } from 'lodash'
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
  ISubmissionSchema,
  ResponseMode,
  Status,
  SubmissionType,
} from 'src/types'

import { PAGE_SIZE } from '../examples.constants'
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
    count: number
    forms: IFormSchema[]
    expectedFormInfo: FormInfo[]
    feedbacks: IFormFeedbackSchema[]
  }
}

describe('examples.service', () => {
  const INVALID_SEARCH_TERM = 'invalidsearchterm'
  let testAgency: IAgencySchema
  const testData: TestData = {
    first: {
      searchTerm: 'first',
      count: 2,
      forms: [],
      expectedFormInfo: [],
      feedbacks: [],
    },
    second: {
      searchTerm: 'second',
      count: 3,
      forms: [],
      expectedFormInfo: [],
      feedbacks: [],
    },
    total: {
      count: 5,
      searchTerm: '',
      forms: [],
      expectedFormInfo: [],
      feedbacks: [],
    },
  }

  beforeAll(async () => {
    await dbHandler.connect()
    const { user, agency } = await dbHandler.insertFormCollectionReqs()
    testAgency = agency

    const baseFormParams = {
      admin: user._id,
      responseMode: ResponseMode.Email,
      emails: [user.email],
      // Important for form status to be public and listed so examples can
      // surface.
      status: Status.Public,
      isListed: true,
    }

    const firstFormsPromises = times(testData.first.count, () =>
      FormModel.create({
        ...baseFormParams,
        title: `${testData.first.searchTerm} ${Math.random()}`,
      }),
    )

    testData.first.forms = await Promise.all(firstFormsPromises)

    const secondFormsPromises = times(testData.second.count, () =>
      FormModel.create({
        ...baseFormParams,
        title: `${testData.second.searchTerm} ${Math.random()}`,
      }),
    )

    testData.second.forms = await Promise.all(secondFormsPromises)

    const submissionPromises: Promise<ISubmissionSchema>[] = []
    // Add submissions to all forms.
    testData.total.forms = testData.first.forms.concat(testData.second.forms)
    testData.total.forms.forEach((form) => {
      submissionPromises.push(
        SubmissionModel.create({
          form: form._id,
          submissionType: SubmissionType.Email,
          responseSalt: 'some salt',
          responseHash: 'some hash',
        }),
      )
    })

    // Add feedback to first forms.
    const randomNumber = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min

    const feedbackScores = times(testData.total.forms.length, () =>
      randomNumber(1, 5),
    )

    const feedbackPromises = feedbackScores.map((score, i) => {
      return FeedbackModel.create({
        rating: score,
        formId: testData.total.forms[i]._id,
      })
    })

    await Promise.all(submissionPromises)
    const feedbacks = await Promise.all(feedbackPromises)
    testData.total.feedbacks = feedbacks
    testData.first.feedbacks = feedbacks.slice(
      0,
      testData.first.forms.length + 1,
    )
    testData.second.feedbacks = feedbacks.slice(testData.first.forms.length)

    // Second form info.
    const createFormInfo = (
      forms: IFormSchema[],
      titlePrefix: 'first' | 'second',
    ): FormInfo[] =>
      forms.map((form, i) => ({
        _id: form._id,
        agency: testAgency.shortName,
        avgFeedback:
          titlePrefix === 'first'
            ? testData.first.feedbacks[i].rating
            : testData.second.feedbacks[i].rating,
        colorTheme: form.startPage!.colorTheme,
        count: 1,
        form_fields: [],
        logo: testAgency.logo,
        timeText: 'less than 1 day ago',
        lastSubmission: expect.anything(),
        title: form.title,
      }))

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
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('getExampleForms', () => {
    describe('with RetrievalType.Stats', () => {
      const getExampleFormsUsingStats = ExamplesService.getExampleForms(
        RetrievalType.Stats,
      )

      describe('when query.searchTerm exists', () => {
        describe('when query.shouldGetTotalNumResults is true', () => {
          it('should return list of form info that match the search term with results count', async () => {})

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
          it('should return only list of form info that match the search term', async () => {})

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

        it('should return DatabaseError when database aggregate pipeline fails', async () => {})
      })

      describe('when query.searchTerm does not exist', () => {
        describe('when query.shouldGetTotalNumResults is true', () => {
          it('should return list of form info with results count', async () => {})

          it('should return empty list with 0 result count when offset is more than number of documents in collection', async () => {
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
              totalNumResults: 0,
            })
          })
        })

        describe('when query.shouldGetTotalNumResults is false', () => {
          it('should return list of form info', async () => {})

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

        it('should return DatabaseError when database aggregate pipeline fails', async () => {})
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
              totalNumResults: testData.second.count,
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
              totalNumResults: testData.total.count,
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
              totalNumResults: testData.total.count,
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
      it('should return form info of given formId when form exists in the database', async () => {})

      it('should return ResultsNotFoundError when form does not exist in the database', async () => {})
    })

    describe('with RetrievalType.Submissions', () => {
      it('should return form info of given formId when form exists in the database', async () => {})

      it('should return ResultsNotFoundError when form does not exist in the database', async () => {})
    })
  })
})

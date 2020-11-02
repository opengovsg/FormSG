import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'

import getFormStatisticsTotalModel from 'src/app/models/form_statistics_total.server.model'
import getSubmissionModel from 'src/app/models/submission.server.model'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { PAGE_SIZE } from '../examples.constants'
import { ResultsNotFoundError } from '../examples.errors'
import * as ExamplesService from '../examples.service'
import { RetrievalType } from '../examples.types'

import prepareTestData, { TestData } from './helpers/prepareTestData'

const FormStatsModel = getFormStatisticsTotalModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)

// Mock min sub count so anything above 0 submissions will be counted.
jest.mock('../examples.constants', () => ({
  PAGE_SIZE: 16,
  MIN_SUB_COUNT: 0,
}))

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
              pageNo: 0,
              shouldGetTotalNumResults: true,
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
              pageNo: 0,
              shouldGetTotalNumResults: true,
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
              pageNo: 0,
              shouldGetTotalNumResults: false,
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
              pageNo: 0,
              shouldGetTotalNumResults: false,
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
              pageNo: 0,
              shouldGetTotalNumResults: true,
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
            const overOffset =
              (await FormStatsModel.estimatedDocumentCount()) / PAGE_SIZE + 1
            // Act
            const actualResults = await getExampleFormsUsingStats({
              pageNo: overOffset,
              shouldGetTotalNumResults: true,
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
              pageNo: 0,
              shouldGetTotalNumResults: false,
            })

            // Assert
            expect(actualResults.isOk()).toEqual(true)
            expect(actualResults._unsafeUnwrap()).toEqual({
              forms: expect.arrayContaining(testData.total.expectedFormInfo),
            })
          })

          it('should return empty list when offset is more than number of documents', async () => {
            // Arrange
            const overOffset =
              (await FormStatsModel.estimatedDocumentCount()) / PAGE_SIZE + 1
            // Act
            const actualResults = await getExampleFormsUsingStats({
              pageNo: overOffset,
              shouldGetTotalNumResults: false,
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
              pageNo: 0,
              shouldGetTotalNumResults: true,
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
              pageNo: 0,
              shouldGetTotalNumResults: true,
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
              pageNo: 0,
              shouldGetTotalNumResults: false,
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
              pageNo: 0,
              shouldGetTotalNumResults: false,
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
              pageNo: 0,
              shouldGetTotalNumResults: true,
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
            const overOffset =
              (await SubmissionModel.estimatedDocumentCount()) / PAGE_SIZE + 1
            // Act
            const actualResults = await getExampleFormsUsingSubs({
              pageNo: overOffset,
              shouldGetTotalNumResults: true,
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
              pageNo: 0,
              shouldGetTotalNumResults: false,
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
            const overOffset =
              (await FormStatsModel.estimatedDocumentCount()) / PAGE_SIZE + 1
            // Act
            const actualResults = await getExampleFormsUsingSubs({
              pageNo: overOffset,
              shouldGetTotalNumResults: false,
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

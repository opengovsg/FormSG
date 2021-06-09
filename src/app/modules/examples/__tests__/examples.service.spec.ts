import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'

import getFormStatisticsTotalModel from 'src/app/models/form_statistics_total.server.model'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { PAGE_SIZE } from '../examples.constants'
import { ResultsNotFoundError } from '../examples.errors'
import * as ExamplesService from '../examples.service'

import prepareTestData, { TestData } from './helpers/prepareTestData'

const FormStatsModel = getFormStatisticsTotalModel(mongoose)

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
    describe('when query.searchTerm exists', () => {
      describe('when query.shouldGetTotalNumResults is true', () => {
        it('should return list of form info that match the search term with results count', async () => {
          // Act
          const actualResults = await ExamplesService.getExampleForms({
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
          const actualResults = await ExamplesService.getExampleForms({
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
          const actualResults = await ExamplesService.getExampleForms({
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
          const actualResults = await ExamplesService.getExampleForms({
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
          const actualResults = await ExamplesService.getExampleForms({
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
          const actualResults = await ExamplesService.getExampleForms({
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
          const actualResults = await ExamplesService.getExampleForms({
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
          const actualResults = await ExamplesService.getExampleForms({
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

  describe('getSingleExampleForm', () => {
    it('should return form info of given formId when form exists in the database', async () => {
      // Arrange
      const expectedFormInfo = testData.first.expectedFormInfo[0]

      // Act
      const actualResults = await ExamplesService.getSingleExampleForm(
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
      const actualResults = await ExamplesService.getSingleExampleForm(
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

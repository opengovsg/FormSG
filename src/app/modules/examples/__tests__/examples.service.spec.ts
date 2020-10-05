import mongoose from 'mongoose'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import getFormStatisticsTotalModel from 'src/app/models/form_statistics_total.server.model'
import getSubmissionModel from 'src/app/models/submission.server.model'

import { PAGE_SIZE } from '../examples.constants'
import * as ExamplesService from '../examples.service'
import { RetrievalType } from '../examples.types'

const FormStatsModel = getFormStatisticsTotalModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)

describe('examples.service', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('getExampleForms', () => {
    // Populate Submission and FormStatisticsTotal collections with valid data.
    beforeEach(async () => {})

    describe('with RetrievalType.Stats', () => {
      const getExampleFormsUsingStats = ExamplesService.getExampleForms(
        RetrievalType.Stats,
      )

      describe('when query.searchTerm exists', () => {
        const VALID_SEARCH_TERM = 'test stats'
        const INVALID_SEARCH_TERM = 'invalidsearchterm'

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
        const VALID_SEARCH_TERM = 'test sub'
        const INVALID_SEARCH_TERM = 'invalidsearchterm'

        describe('when query.shouldGetTotalNumResults is true', () => {
          it('should return list of form info that match the search term with results count', async () => {})

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
          it('should return only list of form info that match the search term', async () => {})

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

        it('should return DatabaseError when database aggregate pipeline fails', async () => {})
      })

      describe('when query.searchTerm does not exist', () => {
        describe('when query.shouldGetTotalNumResults is true', () => {
          it('should return list of form info with results count', async () => {})

          it('should return empty list with 0 result count when offset is more than number of documents in collection', async () => {
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
              totalNumResults: 0,
            })
          })
        })

        describe('when query.shouldGetTotalNumResults is false', () => {
          it('should return only list of form info', async () => {})

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

        it('should return DatabaseError when database aggregate pipeline fails', async () => {})
      })
    })
  })

  describe('getSingleExampleForm', () => {
    describe('with RetrievalType.Stats', () => {
      it('should return form info of given formId when form exists in the database', async () => {})

      it('should return ResultsNotFoundError when form does not exist in the database', async () => {})

      it('should return DatabaseError database aggregate pipeline fails', async () => {})
    })

    describe('with RetrievalType.Submissions', () => {
      it('should return form info of given formId when form exists in the database', async () => {})

      it('should return ResultsNotFoundError when form does not exist in the database', async () => {})

      it('should return DatabaseError database aggregate pipeline fails', async () => {})
    })
  })
})

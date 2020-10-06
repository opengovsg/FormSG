import mongoose from 'mongoose'

import getFormStatisticsTotalModel from 'src/app/models/form_statistics_total.server.model'
import { AggregateFormCountResult, IFormStatisticsTotalSchema } from 'src/types'

import dbHandler from '../helpers/jest-db'

const FormStatsModel = getFormStatisticsTotalModel(mongoose)

describe('FormStatisticsTotal Model', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Statics', () => {
    describe('aggregateFormCount', () => {
      it('should return number of active forms that is above the given minimum submission threshold', async () => {
        // Number of submissions per form
        const formCounts = [12, 10, 4, 20]
        const submissionPromises: Promise<IFormStatisticsTotalSchema>[] = []
        formCounts.forEach((count) => {
          submissionPromises.push(
            FormStatsModel.create({
              formId: mongoose.Types.ObjectId(),
              totalCount: count,
              lastSubmission: new Date(),
            }),
          )
        })
        await Promise.all(submissionPromises)
        const minSubCount = 10

        // Act
        const actualResult = await FormStatsModel.aggregateFormCount(
          minSubCount,
        )

        // Assert
        const expectedResult: AggregateFormCountResult = [
          {
            numActiveForms: formCounts.filter((fc) => fc > minSubCount).length,
          },
        ]
        expect(actualResult).toEqual(expectedResult)
      })

      it('should return empty array if no documents meet the given submission threshold', async () => {
        // Number of submissions per form
        const formCounts = [12, 10, 4]
        const submissionPromises: Promise<IFormStatisticsTotalSchema>[] = []
        formCounts.forEach((count) => {
          submissionPromises.push(
            FormStatsModel.create({
              formId: mongoose.Types.ObjectId(),
              totalCount: count,
              lastSubmission: new Date(),
            }),
          )
        })
        await Promise.all(submissionPromises)
        const minSubCount = 12

        // Act
        const actualResult = await FormStatsModel.aggregateFormCount(
          minSubCount,
        )

        // Assert
        const expectedResult: AggregateFormCountResult = []
        expect(actualResult).toEqual(expectedResult)
      })
    })
  })
})

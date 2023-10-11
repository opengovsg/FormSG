import { keyBy } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { DirectoryFormDto } from 'shared/types'

import { IAgencySchema } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getAgencyModel from '../../models/agency.server.model'
import getFormModel from '../../models/form.server.model'
import getSubmissionModel from '../../models/submission.server.model'
import { DatabaseError } from '../core/core.errors'

import { AgencyNotFoundError } from './directory.errors'

const logger = createLoggerWithLabel(module)

const AgencyModel = getAgencyModel(mongoose)
const FormModel = getFormModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)

const NUM_MILISECONDS_IN_A_DAY =
  24 /* h/day */ * 60 /* min/h */ * 60 /* s/min */ * 1000 /* ms/s */

export const getAllAgencies = (): ResultAsync<
  IAgencySchema[],
  DatabaseError
> => {
  return ResultAsync.fromPromise(AgencyModel.find(), (error) => {
    logger.error({
      message: 'Database error when retrieving all agencies',
      meta: {
        action: 'getAllAgencies',
      },
      error,
    })

    return new DatabaseError()
  })
}

export const getAgencyByShortName = (
  shortName: string,
): ResultAsync<IAgencySchema, AgencyNotFoundError | DatabaseError> => {
  return ResultAsync.fromPromise(
    AgencyModel.findOne({
      shortName,
    }),
    (error) => {
      logger.error({
        message: 'Database error when retrieving agency',
        meta: {
          action: 'getAgencyByShortName',
        },
        error,
      })

      return new DatabaseError()
    },
  ).andThen((agency) => {
    if (!agency) {
      return errAsync(new AgencyNotFoundError())
    }
    return okAsync(agency)
  })
}

export const getAgencyForms = (
  agency: IAgencySchema,
): ResultAsync<DirectoryFormDto[], DatabaseError> => {
  return ResultAsync.fromPromise(
    FormModel.retrieveFormsOwnedByAgencyId(agency._id),
    (error) => {
      logger.error({
        message: 'Database error when retrieving all agencies',
        meta: {
          action: 'getAllAgencies',
        },
        error,
      })
      return new DatabaseError()
    },
  )
}

export const sortAgencyFormsByNumberOfRecentSubmissions = (
  forms: DirectoryFormDto[],
): ResultAsync<DirectoryFormDto[], DatabaseError> => {
  return ResultAsync.combine(
    forms.map(({ _id }) =>
      ResultAsync.fromPromise(
        SubmissionModel.countDocuments({
          form: _id,
          created: {
            $gte: new Date(Date.now() - NUM_MILISECONDS_IN_A_DAY),
          },
        }),
        (error) => {
          logger.error({
            message: 'Database error when retrieving all form submissions',
            meta: {
              action: 'sortAgencyFormsByNumberOfRecentSubmissions',
            },
            error,
          })
          return new DatabaseError()
        },
      ).map((count) => ({ _id, count })),
    ),
  )
    .map((submissionCountsArray) => keyBy(submissionCountsArray, '_id'))
    .map((submissionCounts) =>
      forms.sort(
        (f1, f2) =>
          submissionCounts[f2._id].count - submissionCounts[f1._id].count,
      ),
    )
}

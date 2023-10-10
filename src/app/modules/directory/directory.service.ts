import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { DirectoryFormDto } from 'shared/types'

import { IAgencySchema } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getAgencyModel from '../../models/agency.server.model'
import getFormModel from '../../models/form.server.model'
import { DatabaseError } from '../core/core.errors'

import { AgencyNotFoundError } from './directory.errors'

const logger = createLoggerWithLabel(module)

const AgencyModel = getAgencyModel(mongoose)
const FormModel = getFormModel(mongoose)

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

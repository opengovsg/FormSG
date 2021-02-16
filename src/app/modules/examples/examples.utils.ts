import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'

import { createLoggerWithLabel } from '../../../config/logger'
import { Status } from '../../../types'
import { MapRouteError } from '../../../types/routing'
import { DatabaseError } from '../core/core.errors'

import { ResultsNotFoundError } from './examples.errors'

const logger = createLoggerWithLabel(module)

/**
 * Handler to map ApplicationErrors to their correct status code and error
 * messages.
 * @param error The error to retrieve the status codes and error messages
 * @param coreErrorMessage Any error message to return instead of the default core error message, if any
 */
export const mapRouteError: MapRouteError = (error) => {
  switch (error.constructor) {
    case ResultsNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: error.message,
      }
    case DatabaseError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: error.message,
      }
    default:
      logger.error({
        message: 'Unknown route error observed',
        meta: {
          action: 'mapRouteError',
        },
        error,
      })

      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Something went wrong. Please try again.',
      }
  }
}

/**
 * Creates a query pipeline that can be used to retrieve forms for the /examples
 * page with search parameters.
 *
 * This pipeline, when aggregated upon, will return forms sorted by last
 * submitted date, filtered by number of submissions (greater than
 * given minSubmissionCount), public forms, selected agency, and containing ANY
 * of the searchTerms provided.
 *
 * If there is a formId specified, agency and searchTerm should be null, and it
 * will return an array of only that specified form's data. Otherwise, it will
 * search for forms containing the search terms if specified, filtered by the
 * specified agency.
 * @param agencyId Optional. The id of the agency to filter forms listed by. If no id is given, all matched forms will be returned
 * @param minSubmissionCount The minimum submission count returned forms must have to be returned by the aggregation pipeline
 * @param searchTerm A string of possibly multiple words to filter results by
 * @param lookUpMiddleware An aggregation step to insert into the pipeline after filtering by agency id. Must be lookupSubmissionInfo or lookupFormStatisticsInfo
 * @returns an array of aggregation steps to be used by Form model to aggregate with.
 */
export const createSearchQueryPipeline = ({
  agencyId,
  searchTerm,
}: {
  agencyId?: string
  searchTerm: string
}): Record<string, unknown>[] => {
  const query: Record<string, unknown>[] = [
    // Get formId and formInfo of forms containing the search term.
    {
      $match: {
        $text: { $search: searchTerm },
      },
    },
    {
      $project: {
        formInfo: '$$ROOT',
      },
    },
    // Filter out all inactive/unlisted forms.
    {
      $match: {
        'formInfo.status': Status.Public,
        'formInfo.isListed': true,
      },
    },
    // Retrieve agency info of forms in this stage.
    {
      $lookup: {
        from: 'users',
        localField: 'formInfo.admin',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    // There should only be one user with this _id
    {
      $unwind: '$userInfo',
    },
    {
      $lookup: {
        from: 'agencies',
        localField: 'userInfo.agency',
        foreignField: '_id',
        as: 'agencyInfo',
      },
    },
    // There should only be one agency with this _id
    {
      $unwind: '$agencyInfo',
    },
    {
      $project: {
        userInfo: 0,
      },
    },
  ]

  // Filter by agency id if parameter given.
  if (agencyId) {
    query.push({
      $match: {
        'agencyInfo._id': mongoose.Types.ObjectId(agencyId),
      },
    })
  }
  // Sort by how well search terms were matched.
  query.push(
    {
      $sort: {
        textScore: -1,
      },
    },
    // Retrieve form feedback from the forms that reach this step.
    {
      $lookup: {
        from: 'formfeedback',
        localField: '_id',
        foreignField: 'formId',
        as: 'formFeedbackInfo',
      },
    },
  )

  return query
}

/**
 * Creates a query pipeline that can be used to retrieve forms for the /examples
 * page.
 *
 * This query will return forms sorted by last submitted date, filtered by
 * number of submissions (greater than given minSubmissionCount), public forms,
 * and selected agency.
 * @param groupByMiddleware The inisital The id of the agency to filter forms listed by. If no id is given, all matched forms will be returned
 * @param agencyId Optional. The id of the agency to filter forms listed by. If no id is given, all matched forms will be returned
 * @param minSubmissionCount The minimum submission count returned forms must have to be returned by the aggregation pipeline
 */
export const createGeneralQueryPipeline = (
  agencyId?: string,
): Record<string, unknown>[] => {
  const query: Record<string, unknown>[] = [
    {
      $project: {
        formInfo: '$$ROOT',
      },
    },
    // Filter out all inactive/unlisted forms.
    {
      $match: {
        'formInfo.status': Status.Public,
        'formInfo.isListed': true,
      },
    },
    // Retrieve agency infos of forms in this stage.
    {
      $lookup: {
        from: 'users',
        localField: 'formInfo.admin',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    // There should only be one user with this _id
    {
      $unwind: '$userInfo',
    },
    {
      $lookup: {
        from: 'agencies',
        localField: 'userInfo.agency',
        foreignField: '_id',
        as: 'agencyInfo',
      },
    },
    // There should only be one agency with this _id
    {
      $unwind: '$agencyInfo',
    },
    {
      $project: {
        userInfo: 0,
      },
    },
  ]
  // Filter by agency id if parameter given.
  if (agencyId) {
    query.push({
      $match: {
        'agencyInfo._id': mongoose.Types.ObjectId(agencyId),
      },
    })
  }

  query.push(
    // Retrieve form feedback from the forms that reach this step.
    {
      $lookup: {
        from: 'formfeedback',
        localField: '_id',
        foreignField: 'formId',
        as: 'formFeedbackInfo',
      },
    },
    // More recently created forms appear higher on the examples page.
    {
      $sort: { 'formInfo.created': -1 },
    },
  )
  return query
}

/**
 * Creates a query pipeline that can be used to retrieve the example card data
 * for the /examples page with the specified form id.
 * This pipeline only provides formId, form title, agency logo and color theme.
 * @param formId The specific form to query.
 */
export const createFormIdInfoPipeline = (
  formId: string,
): Record<string, unknown>[] => {
  // Retrieve all forms with the specified formId.
  return [
    {
      $match: {
        _id: mongoose.Types.ObjectId(formId),
      },
    },
    {
      $project: {
        formInfo: '$$ROOT',
      },
    },
    // Filter out all inactive/unlisted forms.
    {
      $match: {
        'formInfo.status': Status.Public,
        'formInfo.isListed': true,
      },
    },
    // Retrieve agency infos of forms in this stage.
    {
      $lookup: {
        from: 'users',
        localField: 'formInfo.admin',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    // There should only be one user with this _id
    {
      $unwind: '$userInfo',
    },
    {
      $lookup: {
        from: 'agencies',
        localField: 'userInfo.agency',
        foreignField: '_id',
        as: 'agencyInfo',
      },
    },
    // There should only be one agency with this _id
    {
      $unwind: '$agencyInfo',
    },
    {
      $project: {
        userInfo: 0,
      },
    },
    // Project form information without submission/feedback information.
    {
      $project: {
        _id: 1,
        title: '$formInfo.title',
        form_fields: '$formInfo.form_fields',
        logo: '$agencyInfo.logo',
        agency: '$agencyInfo.shortName',
        colorTheme: '$formInfo.startPage.colorTheme',
      },
    },
    // Retrieve form feedbacks for the submissions.
    {
      $lookup: {
        from: 'formfeedback',
        localField: '_id',
        foreignField: 'formId',
        as: 'formFeedbackInfo',
      },
    },
    {
      $addFields: {
        avgFeedback: {
          $avg: '$formFeedbackInfo.rating',
        },
      },
    },
    // Project submissions by form id, get submission count, get the last
    // submission date, along with the average feedback of the submissions.
    {
      $project: {
        agency: 1,
        avgFeedback: 1,
        colorTheme: 1,
        form_fields: 1,
        logo: 1,
        title: 1,
      },
    },
  ]
}

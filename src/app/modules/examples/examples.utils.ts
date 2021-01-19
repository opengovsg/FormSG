import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { MapRouteError } from '../../../types/routing'
import { DatabaseError } from '../core/core.errors'

import { ResultsNotFoundError } from './examples.errors'
import {
  addAvgFeedback,
  filterByAgencyId,
  filterInactiveAndUnlistedForms,
  lookupAgencyInfo,
  lookupFormFeedback,
  projectFormDetails,
  searchForms,
  searchFormsById,
  searchFormsWithText,
  sortByCreated,
  sortByRelevance,
} from './examples.queries'

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
  // Get formId and formInfo of forms containing the search term.
  return searchFormsWithText(searchTerm).concat(
    // Filter out all inactive/unlisted forms.
    filterInactiveAndUnlistedForms,
    // Retrieve agency infos of forms in this stage.
    lookupAgencyInfo,
    // Filter by agency id if parameter given.
    agencyId ? filterByAgencyId(agencyId) : [],
    // Sort by how well search terms were matched.
    sortByRelevance,
    // Retrieve form feedback from the forms that reach this step.
    lookupFormFeedback,
  )
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
  return searchForms().concat(
    // More recently created forms appear higher on the examples page.
    sortByCreated,
    // Filter out all inactive/unlisted forms.
    filterInactiveAndUnlistedForms,
    // Retrieve agency infos of forms in this stage.
    lookupAgencyInfo,
    // Filter by agency id if parameter given.
    agencyId ? filterByAgencyId(agencyId) : [],
    // Retrieve form feedback from the forms that reach this step.
    lookupFormFeedback,
  )
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
  return searchFormsById(formId).concat(
    // Filter out all inactive/unlisted forms.
    filterInactiveAndUnlistedForms,
    // Retrieve agency infos of forms in this stage.
    lookupAgencyInfo,
    // Project form information without submission/feedback information.
    projectFormDetails,
    // Retrieve form feedbacks for the submissions.
    lookupFormFeedback,
    // Project submissions by form id, get submission count, get the last
    // submission date, along with the average feedback of the submissions.
    addAvgFeedback,
  )
}

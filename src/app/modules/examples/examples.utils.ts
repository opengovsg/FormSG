import {
  filterByAgencyId,
  filterBySubmissionCount,
  filterInactiveAndUnlistedForms,
  lookupAgencyInfo,
  lookupFormFeedback,
  lookupFormInfo,
  searchFormsWithText,
  sortByLastSubmitted,
  sortByRelevance,
} from './examples.queries'

/**
 * Creates a query pipeline that is used to retrieve forms for the /examples
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
 * @param lookUpMiddleware Optional. An aggregation step to insert into the pipeline after filtering by agency id
 * @returns an array of aggregation steps to be used by Form model to aggregate with.
 */
export const createSearchQueryPipeline = ({
  agencyId,
  searchTerm,
  minSubmissionCount,
  lookUpMiddleware = [],
}: {
  agencyId?: string
  searchTerm: string
  minSubmissionCount: number
  lookUpMiddleware?: Record<string, unknown>[]
}): Record<string, unknown>[] => {
  // Get formId and formInfo of forms containing the search term.
  return searchFormsWithText(searchTerm).concat(
    // Filter out all inactive/unlisted forms.
    filterInactiveAndUnlistedForms,
    // Retrieve agency infos of forms in this stage.
    lookupAgencyInfo,
    // Filter by agency id if parameter given.
    agencyId ? filterByAgencyId(agencyId) : [],
    // Any other look ups to insert before performing filtering.
    lookUpMiddleware,
    // Only display forms with more than minSubmissionCount submissions.
    filterBySubmissionCount(minSubmissionCount),
    // Sort by how well search terms were matched.
    sortByRelevance,
    // Retrieve form feedback from the forms that reach this step.
    lookupFormFeedback,
  )
}

/**
 * Creates a query that is used to retrieve forms for the /examples page.
 *
 * This query will return forms sorted by last submitted date, filtered by
 * number of submissions (greater than given minSubmissionCount), public forms,
 * and selected agency.
 * @param groupSubmissionMiddleware The inisital The id of the agency to filter forms listed by. If no id is given, all matched forms will be returned
 * @param agencyId Optional. The id of the agency to filter forms listed by. If no id is given, all matched forms will be returned
 * @param minSubmissionCount The minimum submission count returned forms must have to be returned by the aggregation pipeline
 */
export const createGeneralQueryPipeline = ({
  groupSubmissionMiddleware,
  agencyId,
  minSubmissionCount,
}: {
  groupSubmissionMiddleware: Record<string, unknown>[]
  agencyId?: string
  minSubmissionCount: number
}): Record<string, unknown>[] => {
  return groupSubmissionMiddleware.concat(
    // Only display forms with more than minSubmissionCount submissions.
    filterBySubmissionCount(minSubmissionCount),
    // More recently submitted forms appear higher on the examples page.
    sortByLastSubmitted,
    // Retrieve form info from the forms that reach this step.
    lookupFormInfo,
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

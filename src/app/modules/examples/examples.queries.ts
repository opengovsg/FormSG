import mongoose from 'mongoose'

/**
 * Precondition: Must be called as the **first** step in the aggregation
 * pipeline (requirement for MongoDB match text).
 *
 * Aggregation step to retrieve `_id` and `formInfo` of forms that contain words
 * that match given search term.
 * @param searchTerm The word that must appear in the form to be retrieved.
 * @returns aggregate step to search forms with text
 */
export const searchFormsWithText = (
  searchTerm: string,
): Record<string, unknown>[] => [
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
]

/**
 * Precondition: `formInfo` must be retrieved beforehand, which can be done with
 * lookupFormInfo or searchFormsWithText.
 *
 * Aggregation step to only allow public and listed forms to pass to the next
 * step in the pipeline.
 */
export const filterInactiveAndUnlistedForms: Record<string, unknown>[] = [
  {
    $match: {
      'formInfo.status': 'PUBLIC',
      'formInfo.isListed': true,
    },
  },
]

/**
 * Aggregation step to retrieve `agencyInfo` from agencies collection for each
 * form's admin agency data.
 */
export const lookupAgencyInfo: Record<string, unknown>[] = [
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

/**
 * Precondition: `agencyInfo` must be retrieved beforehand, which can be done
 * with lookupAgencyInfo.
 *
 * Aggregation step to only allow forms from a specific agency from passing.
 * @returns aggregate step to filter pipeline by given agency id
 */
export const filterByAgencyId = (
  agencyId: string,
): Record<string, unknown>[] => [
  {
    $match: {
      'agencyInfo._id': mongoose.Types.ObjectId(agencyId),
    },
  },
]

/**
 * Precondition: A group stage that produced a count field must be executed
 * beforehand, which can be done with groupSubmissionsByFormId or
 * lookupSubmissionInfo.

 * Aggregation step to filter forms with less than the minimum number of
 * submissions for the examples page. 
 * 
 * @param minSubmissionCount The minimum submission count of each form to allow past this aggragate step
  * @returns aggregate step to return submissions with at least minSubmissionCount
 */
export const filterBySubmissionCount = (
  minSubmissionCount: number,
): Record<string, unknown>[] => [
  {
    $match: {
      count: {
        $gt: minSubmissionCount,
      },
    },
  },
]

/**
 * Precondition: A match by text was called earlier, which can be done with
 * searchFormsWithText.

 * Aggregation step to sort forms by their textScore relevance; i.e. how well
 * the search terms were matched.
 */
export const sortByRelevance: Record<string, unknown>[] = [
  {
    $sort: {
      textScore: -1,
    },
  },
]

/**
 * Precondition: `lastSubmission` field must have been generated beforehand,
 * which can be done using `groupSubmissionsByFormId`.
 *
 * Aggregation step to sort forms by the last submitted date.
 */
export const sortByLastSubmitted = [
  {
    $sort: { lastSubmission: -1 },
  },
]

/**
 * Precondition: `_id` field corresponding to the form's id must be retrieved
 * beforehand, which can be done using groupSubmissionsByFormId or
 * searchFormsForText.
 *
 * Aggregation step to retrieve `formFeedbackInfo` from the formfeedback
 * collection for each of the `formId`s specified.
 */
export const lookupFormFeedback = [
  {
    $lookup: {
      from: 'formfeedback',
      localField: '_id',
      foreignField: 'formId',
      as: 'formFeedbackInfo',
    },
  },
]

/**
 * Precondition: `_id` field corresponding to form's id must be retrieved
 * beforehand, which can be done by grouping submissions using
 * groupSubmissionsByFormId.
 *
 * Aggregation step to retrieve `formInfo` from the forms collection for each
 * form's form id.
 */
export const lookupFormInfo = [
  {
    $lookup: {
      from: 'forms',
      localField: '_id',
      foreignField: '_id',
      as: 'formInfo',
    },
  },
  // There should only be one form with this _id
  {
    $unwind: '$formInfo',
  },
]

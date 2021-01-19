import mongoose from 'mongoose'

import { Status } from '../../../types'

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
 * Precondition: Must be called as the **first** step in the aggregation
 * pipeline (requirement for MongoDB match text).
 *
 * Aggregation step to retrieve `_id` and `formInfo` of forms, without filtering
 * for search terms.
 * @returns aggregate step to search forms
 */
export const searchForms = (): Record<string, unknown>[] => [
  {
    $project: {
      formInfo: '$$ROOT',
    },
  },
]

/**
 * Produces an aggregation step to retrieve form with the specified formId.
 * @param formId The _id field of the form to be retrieved
 */
export const searchFormsById = (formId: string): Record<string, unknown>[] => [
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
      'formInfo.status': Status.Public,
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
 * Precondition: A match by text was called earlier, which can be done with
 * searchFormsWithText.
 *
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
 * Precondition: `created` field must have already been retrieved from the
 * submissions collection via searchSubmissionsForForm.
 *
 * Aggregation step to sort forms by the creation date.
 */
export const sortByCreated = [
  {
    $sort: { created: 1 },
  },
]

/**
 * Precondition: `_id` field corresponding to the forms' ids must be retrieved
 * beforehand, which can be done using groupSubmissionsByFormId or
 * searchFormsForText.
 *
 * Aggregation step to retrieve `formFeedbackInfo` from the formfeedback
 * collection for each of the `formId`s specified.
 */
export const lookupFormFeedback: Record<string, unknown>[] = [
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
 * Precondition: `formInfo` must be retrieved beforehand, which can be done with
 * lookupFormInfo, searchFormsWithText or searchFormsById.
 *
 * Aggregation step to project form information without submission/feedback
 * information.
 */
export const projectFormDetails: Record<string, unknown>[] = [
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
]

/**
 * Aggregation step to produce an object containing the pageResults and
 * totalCount.
 * pageResults will only contain condensed information to be displayed on an
 * example card.
 * @param limit Number of forms to return information about.
 * @param offset Number of forms that have already been returned previously and should be skipped in this query.
 */
export const selectAndProjectCardInfo = (
  limit: number,
  offset: number,
): Record<string, unknown>[] => [
  {
    $skip: offset,
  },
  {
    $limit: limit,
  },
  {
    $project: {
      _id: 1,
      count: 1,
      lastSubmission: 1,
      title: '$formInfo.title',
      form_fields: '$formInfo.form_fields',
      logo: '$agencyInfo.logo',
      agency: '$agencyInfo.shortName',
      colorTheme: '$formInfo.startPage.colorTheme',
      avgFeedback: { $avg: '$formFeedbackInfo.rating' },
    },
  },
]

/**
 * Precondition: `formFeedbackInfo` must have been retrieved in a previous step,
 * which can be done using lookupFormFeedback.
 *
 * Aggregation step to add the average feedback field.
 */
export const addAvgFeedback = [
  {
    $addFields: {
      avgFeedback: {
        $avg: '$formFeedbackInfo.rating',
      },
    },
  },
]

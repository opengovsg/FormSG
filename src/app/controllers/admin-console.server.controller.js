'use strict'

/**
 * Module dependencies.
 */
const mongoose = require('mongoose')
const moment = require('moment-timezone')
const { StatusCodes } = require('http-status-codes')

const getLoginModel = require('../models/login.server.model').default
const getSubmissionModel = require('../models/submission.server.model').default
const getFormStatisticsTotalModel = require('../models/form_statistics_total.server.model')
  .default
const getFormModel = require('../models/form.server.model').default

const Login = getLoginModel(mongoose)
const Submission = getSubmissionModel(mongoose)
const FormStatisticsTotal = getFormStatisticsTotalModel(mongoose)
const Form = getFormModel(mongoose)
const _ = require('lodash')

const logger = require('../../config/logger').createLoggerWithLabel(module)
const { getMeta, getTrace } = require('../utils/request')

// Examples search-specific constants
const PAGE_SIZE = 16 // maximum number of results to return
const MIN_SUB_COUNT = 10 // minimum number of submissions before search is returned

// Examples search-specific query components

/**
 * Aggregation step to retrieve formInfo from the forms collection for each form's form Id.
 * Precondition: _id field corresponding to form Id's must be retrieved beforehand, which can be done by
 * grouping submissions using groupSubmissionsByFormId.
 */
let lookupFormInfo = [
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

/**
 * Aggregation step to retrieve agencyInfo from agencies collection for each form's admin agency data.
 */
let lookupAgencyInfo = [
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
 * Aggregation step to retrieve submissionInfo by looking up, sorting and grouping submissions with form Ids specified.
 * Precondition: _id field corresponding to form Id's must be retrieved beforehand, which can be done using
 * groupSubmissionsByFormId or searchFormsForText.
 */
let lookupFormStatisticsInfo = [
  {
    $lookup: {
      from: 'formStatisticsTotal',
      localField: '_id',
      foreignField: 'formId',
      as: 'submissionInfo',
    },
  },
  // Unwind results in multiple copies of each form, where each copy has its own submissionInfo
  {
    $unwind: '$submissionInfo',
  },
  {
    $project: {
      _id: '$_id',
      count: '$submissionInfo.totalCount',
      formInfo: 1,
      agencyInfo: 1,
      lastSubmission: '$submissionInfo.lastSubmission',
      textScore: { $meta: 'textScore' }, // Used to sort by relevance
    },
  },
]

/**
 * Aggregation step to retrieve submissionInfo by looking up, sorting and grouping submissions with form Ids specified.
 * Precondition: _id field corresponding to form Id's must be retrieved beforehand, which can be done using
 * groupSubmissionsByFormId or searchFormsForText.
 */
let lookupSubmissionInfo = [
  {
    $lookup: {
      from: 'submissions',
      localField: '_id',
      foreignField: 'form',
      as: 'submissionInfo',
    },
  },
  // Unwind results in multiple copies of each form, where each copy has its own submissionInfo
  {
    $unwind: '$submissionInfo',
  },
  {
    $sort: { 'submissionInfo.created': 1 },
  },
  // Retrieve only the necessary information from the submissionInfo
  {
    $group: {
      _id: '$_id',
      count: { $sum: 1 },
      formInfo: { $first: '$formInfo' },
      agencyInfo: { $first: '$agencyInfo' },
      lastSubmission: { $last: '$submissionInfo.created' },
      textScore: { $first: { $meta: 'textScore' } }, // Used to sort by relevance
    },
  },
]

/**
 * Aggregation step to retrieve formFeedbackInfo from formfeedback collection for each of the formIds specified.
 * Precondition: _id field corresponding to form Id's must be retrieved beforehand, which can be done using
 * groupSubmissionsByFormId or searchFormsForText.
 */
let lookupFormFeedback = [
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
 * Aggregation step to filter forms with less than the minimum number of submissions for the examples page.
 * Precondition: A group stage that produced a count field must be executed beforehand, which can be done with
 * groupSubmissionsByFormId or lookupSubmissionInfo.
 */
let filterBySubmissionCount = [
  {
    $match: {
      count: {
        $gt: MIN_SUB_COUNT,
      },
    },
  },
]

/**
 * Aggregation step to sort forms by the last submitted date.
 * Precondition: lastSub field must have been generated beforehand, which can be done using groupSubmissionsByFormId.
 */
let sortByLastSubmitted = [
  {
    $sort: { lastSubmission: -1 },
  },
]

/**
 * Aggregation step to only allow public and listed forms to pass.
 * Precondition: formInfo must be retrieved beforehand, which can be done with lookupFormInfo or searchFormsForText.
 */
let filterInactiveAndUnlistedForms = [
  {
    $match: {
      'formInfo.status': 'PUBLIC',
      'formInfo.isListed': true,
    },
  },
]

/**
 * Aggregation step to retrieve _id and formInfo of forms that contain words that match searchTerm. Must
 * be called as the first step in the aggregation pipeline (requirement for MongoDB match text).
 * @param searchTerm The word that must appear in the form to be shown.
 */
let searchFormsForText = (searchTerm) => [
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
 * Aggregation step to sort forms by their relevance in the search.
 * Precondition: A match by text was called earlier.
 */
let sortByRelevance = [
  {
    $sort: {
      textScore: -1,
    },
  },
]

/**
 * Aggregation step to only allow forms from a specific agency from passing.
 * Precondition: agencyInfo must be retrieved beforehand, which can be done with lookupAgencyInfo.
 */
let filterByAgency = (agency) => [
  {
    $match: {
      'agencyInfo._id': mongoose.Types.ObjectId(agency),
    },
  },
]

/**
 * Produces an aggregation step to retrieve form with the specified formId, to be used with .aggregate().
 * @param {String} formId The _id field of the form to be retrieved
 */
let searchFormsById = (formId) => [
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
 * Aggregation step to produce an object containing the pageResults and totalCount.
 * pageResults will only contain condensed information to be displayed on an example card.
 * @param num Number of forms to return information about.
 * @param offset Number of forms that have already been returned previously and should be skipped in this query.
 */
const selectAndProjectCardInfo = ({ num, offset }) => [
  {
    $skip: offset,
  },
  {
    $limit: num,
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
 * Aggregation step to project form information without submission/feedback information.
 */
let projectFormDetails = [
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
 * Aggregation step to group submissions by form id, count the number of submissions, and get the last submission date.
 * To be used on the submissions collection.
 * Precondition: _id field corresponding to form Id's must be retrieved beforehand.
 */
let groupSubmissionsByFormId = [
  {
    $group: {
      _id: '$form',
      count: { $sum: 1 },
      lastSubmission: { $last: '$created' },
    },
  },
]

/**
 * Aggregation step to project submissions by form id, get submission count, and get the last submission date.
 * To be used on the FormStatisticsTotal collection.
 * Precondition: _id field corresponding to form Id's must be retrieved beforehand.
 */
let projectSubmissionInfo = [
  {
    $project: {
      _id: '$formId',
      count: '$totalCount',
      lastSubmission: 1,
    },
  },
]

/**
 * Creates a query that is used to retrieve forms for the /examples page.
 * This query will return forms sorted by last submitted date, filtered by
 * number of submissions (greater than MIN_SUB_COUNT), public forms, and
 * selected agency.
 * @param agency The agency to filter forms listed by.
 */
const createGeneralQuery = (agency, groupSubmissionMiddleware, collection) => {
  const pipeline = _.concat(
    groupSubmissionMiddleware,
    filterBySubmissionCount, // Only display forms with more than MIN_SUB_COUNT submissions
    sortByLastSubmitted, // More recently submitted forms appear higher on the examples page
    lookupFormInfo,
    filterInactiveAndUnlistedForms,
    lookupAgencyInfo,
    agency ? filterByAgency(agency) : [], // If no agency is specified, do not filter by agency
    lookupFormFeedback,
  )
  return collection.aggregate(pipeline).read('secondary')
}

/**
 * Creates a query that is used to retrieve forms for the /examples page with
 * search parameters.
 * This query will return forms sorted by last submitted
 * date, filtered by number of submissions (greater than MIN_SUB_COUNT), public
 * forms, selected agency, and containing ANY of the searchTerms provided.
 * If there is a formId specified, agency and searchTerm should be null, and it
 * will return an array of only that specified form's data. Otherwise, it will
 * search for forms containing the search terms if specified, filtered by the
 * specified agency.
 * @param agency The agency to filter forms listed by.
 * @param searchTerm A string of possibly multiple words to filter results by.
 */
const createSearchQuery = (agency, searchTerm, lookUpMiddleware) => {
  const pipeline = _.concat(
    searchFormsForText(searchTerm), // Get formId and formInfo of forms containing the search term
    filterInactiveAndUnlistedForms,
    lookupAgencyInfo,
    agency ? filterByAgency(agency) : [],
    lookUpMiddleware, // Get lastSubmission and count
    filterBySubmissionCount,
    sortByRelevance, // Sort by how well search terms were matched
    lookupFormFeedback,
  )
  return Form.aggregate(pipeline).read('secondary')
}

/**
 * Creates a query that is used to retrieve the example card data for the /examples page with the specified FormId.
 * This only provides formId, form title, agency logo and color theme.
 * @param formId The specific form to query.
 */
let createFormIdInfoQuery = (formId) => {
  let pipeline = _.concat(
    searchFormsById(formId),
    filterInactiveAndUnlistedForms,
    lookupAgencyInfo,
    projectFormDetails,
  )
  return Form.aggregate(pipeline)
}

/**
 * Aggregation step to add the average feedback field.
 * Precondition: formFeedbackInfo was already retrieved, which can be done using lookupFormFeedback.
 */
let addAvgFeedback = [
  {
    $addFields: {
      avgFeedback: {
        $avg: '$formFeedbackInfo.rating',
      },
    },
  },
]

/**
 * Aggregation step to sort forms by the creation date.
 * Precondition: created field must be retrieved from the submissions collection.
 */
let sortByCreated = [
  {
    $sort: { created: 1 },
  },
]

/**
 * Produces an aggregation step to retrieve submissions for the form with the specified formId.
 * @param {String} formId The _id field of the form to be retrieved
 */
let searchSubmissionsForForm = (key, formId) => [
  {
    $match: {
      [key]: mongoose.Types.ObjectId(formId),
    },
  },
]

/**
 * Creates a query that is used to retrieve the submission statistics for the
 * form with the specified FormId.
 * This only provides submission count, last submission date and average
 * feedback from the submissions/feedback collection
 * @param formId The specific form to return
 */
let createFormIdSubmissionQuery = (formId) => {
  let pipeline = _.concat(
    searchSubmissionsForForm('form', formId),
    sortByCreated,
    groupSubmissionsByFormId,
    sortByLastSubmitted,
    lookupFormFeedback,
    addAvgFeedback,
  )
  return Submission.aggregate(pipeline).read('secondary')
}

/**
 * Creates a query that is used to retrieve the submission statistics for the form with the specified FormId.
 * This only provides submission count, last submission date and average feedback from the form stats/feedback collection
 * @param formId The specific form to return
 */
const createFormIdStatsQuery = (formId) => {
  // TODO link up
  const pipeline = _.concat(
    searchSubmissionsForForm('formId', formId),
    [
      {
        $project: {
          _id: '$formId',
          count: '$totalCount',
          lastSubmission: 1,
        },
      },
    ],
    lookupFormFeedback,
    [
      {
        $project: {
          _id: '$formId',
          count: 1,
          lastSubmission: 1,
          avgFeedback: { $avg: '$formFeedbackInfo.rating' },
        },
      },
    ],
  )
  return FormStatisticsTotal.aggregate(pipeline).read('secondary')
}

// Helper function to parse last submission time
let parseTime = (lastSubmission) => {
  let timeDiffDays = moment().diff(lastSubmission, 'days')

  if (timeDiffDays <= 1) {
    return 'less than 1 day ago'
  } else if (timeDiffDays < 30) {
    return `${timeDiffDays} days ago`
  } else {
    return moment(lastSubmission).format('D MMM, YYYY')
  }
}

/**
 * Performs a mongo query for either the standard submissions collection or a collection with aggregated values
 * @param {String} collection - Collection to conduct search on
 * @param {Function} lookUpMiddleware - Custom function to look up collection
 * @param {Function} groupSubmissionMiddleware - Custom function to group values in collection
 * @param {Object} query - Query parameters in req.query
 * @param {Function} cb - Callback function
 */
const getExampleFormsUsing = (
  collection,
  lookUpMiddleware,
  groupSubmissionMiddleware,
  query,
  cb,
) => {
  const { pageNo, searchTerm, agency, shouldGetTotalNumResults } = query || {}
  const offset = parseInt(pageNo) * PAGE_SIZE

  let mongoQuery = searchTerm
    ? createSearchQuery(agency, searchTerm, lookUpMiddleware)
    : createGeneralQuery(agency, groupSubmissionMiddleware, collection)
  mongoQuery.allowDiskUse(true) // prevents out-of-memory for large search results (max 100MB)

  if (shouldGetTotalNumResults === 'true') {
    mongoQuery = mongoQuery
      .facet({
        pageResults: selectAndProjectCardInfo({ num: PAGE_SIZE, offset }),
        totalCount: [{ $count: 'count' }],
      }) // Get count of all forms returned by query
      .exec()
      .then((result) => {
        let [{ pageResults, totalCount }] = result
        pageResults.forEach((x) => {
          x.timeText = parseTime(x.lastSubmission)
        })
        const totalNumResults = _.get(totalCount, '[0].count', 0)
        return cb(null, StatusCodes.OK, { forms: pageResults, totalNumResults })
      })
  } else {
    mongoQuery = mongoQuery
      .append(selectAndProjectCardInfo({ num: PAGE_SIZE, offset }))
      .exec()
      .then((pageResults) => {
        pageResults.forEach((x) => {
          x.timeText = parseTime(x.lastSubmission)
        })
        return cb(null, StatusCodes.OK, { forms: pageResults })
      })
  }

  mongoQuery.catch((err) => {
    return cb(err, StatusCodes.INTERNAL_SERVER_ERROR, {
      message: 'Error in retrieving example forms.',
    })
  })
}

/**
 * Performs a mongo query with the parameters in the req, and sends a response containing the form(s)/error message.
 * @param req - Express request object
 * @param {Number} req.query.pageNo - The page of results to load. Each page contains PAGE_SIZE results.
 * @param {String} req.query.searchTerm - A String that must be present in the resulting forms
 * @param {String} req.query.agency - The agency to filter forms
 * @param {String} req.query.shouldGetTotalNumResults - Boolean to indicate if the total number of results should be calculated
 * @param res The response object
 */
exports.getExampleFormsUsingAggregateCollection = function (req, res) {
  getExampleFormsUsing(
    FormStatisticsTotal,
    lookupFormStatisticsInfo,
    projectSubmissionInfo,
    req.query,
    (error, status, result) => {
      if (error)
        logger.error({
          message: 'Failed to retrieve example forms',
          meta: {
            action: 'getExampleFormsUsingAggregateCollection',
            ...getMeta(req),
          },
          error,
        })
      return res.status(status).json(result)
    },
  )
}

/**
 * Performs a mongo query with the parameters in the req, and sends a response containing the form(s)/error message.
 * @param req - Express request object
 * @param {Number} req.query.pageNo - The page of results to load. Each page contains PAGE_SIZE results.
 * @param {String} req.query.searchTerm - A String that must be present in the resulting forms
 * @param {String} req.query.agency - The agency to filter forms
 * @param {String} req.query.shouldGetTotalNumResults - Boolean to indicate if the total number of results should be calculated
 * @param res The response object
 */
exports.getExampleFormsUsingSubmissionsCollection = function (req, res) {
  getExampleFormsUsing(
    Submission,
    lookupSubmissionInfo,
    groupSubmissionsByFormId,
    req.query,
    (error, status, result) => {
      if (error) {
        logger.error({
          message: 'Failed to retrieve example forms',
          meta: {
            action: 'getExampleFormsUsingSubmissionsCollection',
            ...getMeta(req),
          },
          error,
        })
      }
      return res.status(status).json(result)
    },
  )
}

/**
 * Performs a mongo query on the submissions collection to retrieve a single form for examples.
 * @param {String} formId - The specific form to return
 * @param {Function} retrieveSubmissionStatistics - Custom query to fetch statistics
 * @param {Function} cb - Callback function
 */
const getSingleExampleFormUsing = (
  formId,
  retrieveSubmissionStatistics,
  cb,
) => {
  if (!formId || !mongoose.Types.ObjectId.isValid(formId)) {
    return cb(null, StatusCodes.BAD_REQUEST, {
      message: 'Form URL is missing/invalid.',
    })
  }

  let mongoQuery = createFormIdInfoQuery(formId)

  mongoQuery
    .allowDiskUse(true) // prevents out-of-memory for large search results (max 100MB)
    .exec((err, result) => {
      // Error
      if (err) {
        return cb(err, StatusCodes.INTERNAL_SERVER_ERROR, {
          message: 'Error in retrieving example forms.',
        })
      }
      if (!result) {
        return cb(err, StatusCodes.NOT_FOUND, { message: 'No results found.' })
      }

      let [form] = result
      if (!form) {
        // The form data was not retrieved (formId likely invalid)
        return cb(err, StatusCodes.NOT_FOUND, {
          message: 'Error in retrieving template form - form not found.',
        })
      }

      // If the form was found, perform second query for statistics
      let statsQuery = retrieveSubmissionStatistics(formId)
      statsQuery.exec((err, result) => {
        // If the statistics cannot be found, add default "null" fields before sending the form
        if (err || !result || result.length === 0) {
          form.count = 0
          form.lastSubmission = null
          form.timeText = '-'
          form.avgFeedback = null
          // Otherwise attach the actual results of the query
        } else {
          let [submissionDetails] = result
          form.count = submissionDetails.count
          form.lastSubmission = submissionDetails.lastSubmission
          form.avgFeedback = submissionDetails.avgFeedback
          form.timeText = parseTime(form.lastSubmission)
        }
        return cb(err, StatusCodes.OK, { form })
      })
    })
}

/**
 * Performs a mongo query on the submissions collection to retrieve a single form for examples.
 * @param req Express request object
 * @param {String} req.params.formId _ The specific form to return
 * @param res Express response object
 */
exports.getSingleExampleFormUsingSubmissionCollection = function (req, res) {
  getSingleExampleFormUsing(
    req.params.formId,
    createFormIdSubmissionQuery,
    (error, status, result) => {
      if (error) {
        logger.error({
          message: 'Failed to retrieve a single example form',
          meta: {
            action: 'getSingleExampleFormUsingSubmissionCollection',
            ...getMeta(req),
          },
          error,
        })
      }
      return res.status(status).json(result)
    },
  )
}

/**
 * Performs a mongo query on the aggregate collection to retrieve a single form for examples.
 * @param req Express request object
 * @param {String} req.params.formId _ The specific form to return
 * @param res Express response object
 */
exports.getSingleExampleFormUsingAggregateCollection = function (req, res) {
  getSingleExampleFormUsing(
    req.params.formId,
    createFormIdStatsQuery,
    (err, status, result) => {
      if (err) {
        logger.error({
          message: 'Failed to retrieve single example form',
          meta: {
            action: 'getSingleExampleFormUsingAggregateCollection',
            ...getMeta(req),
          },
          error: err,
        })
      }
      return res.status(status).json(result)
    },
  )
}

exports.getLoginStats = function (req, res) {
  let { yr, mth, esrvcId } = req.query
  let year = parseInt(yr)
  let month = parseInt(mth)

  const startOfMonth = moment
    .tz([year, month], 'Asia/Singapore')
    .startOf('month')
  const endOfMonth = moment(startOfMonth).endOf('month')
  Login.aggregate(
    [
      {
        $match: {
          esrvcId,
          created: {
            $gte: startOfMonth.toDate(),
            $lte: endOfMonth.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            form: '$form',
            admin: '$admin',
            authType: '$authType',
          },
          total: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.admin',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo',
      },
      {
        $lookup: {
          from: 'forms',
          localField: '_id.form',
          foreignField: '_id',
          as: 'formInfo',
        },
      },
      {
        $unwind: '$formInfo',
      },
      {
        $project: {
          _id: 0,
          adminEmail: '$userInfo.email',
          formName: '$formInfo.title',
          total: '$total',
          formId: '$_id.form',
          authType: '$_id.authType',
        },
      },
    ],
    function (error, loginStats) {
      if (error) {
        logger.error({
          message: 'Failed to retrieve billing records',
          meta: {
            action: 'getLoginStats',
            ...getMeta(req),
          },
          error,
        })
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: 'Error in retrieving billing records' })
      } else if (!loginStats) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: 'No billing records found' })
      } else {
        logger.info({
          message: `Billing search for ${esrvcId} by ${
            req.session.user && req.session.user.email
          }`,
          meta: {
            action: 'getLoginStats',
            trace: getTrace(req),
          },
        })

        return res.json({
          loginStats,
        })
      }
    },
  )
}

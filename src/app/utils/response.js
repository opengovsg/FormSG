const validateField = require('./field-validation')
const logicUtil = require('../../shared/util/logic')
const _ = require('lodash')
const { ConflictError } = require('./custom-errors.js')

/**
 * For each form field, select the first response that is available for that field
 *
 * @param {Object} form
 * @param {Mongoose.ObjectId} form._id
 * @param {Array} form.form_fields
 * @param {Array} responses
 * @param {Function} modeFilter
 * @returns {Array} one response for each field id
 */
const getResponsesForEachField = function (form, responses, modeFilter) {
  const fieldIds = modeFilter(form.form_fields).map((field) => {
    return { _id: String(field._id) }
  })
  const uniqueResponses = _.uniqBy(modeFilter(responses), '_id')
  const results = _.intersectionBy(uniqueResponses, fieldIds, '_id')
  if (results.length < fieldIds.length) {
    const onlyInForm = _.differenceBy(fieldIds, results, '_id').map(
      ({ _id }) => _id,
    )
    throw new ConflictError(
      `formId="${form._id}" message="Some form fields are missing" onlyInForm="${onlyInForm}"`,
    )
  }
  return results
}

/**
 * Check that a form submission should have been prevented by logic. If so,
 * throw an error.
 * @param {Object} form
 * @param {Array} responses
 * @param {Set} visibleFieldIds
 * @throws {Error} Throws an error if form submission should have been prevented by logic.
 */
const validatePreventSubmitLogic = function (form, responses, visibleFieldIds) {
  if (
    logicUtil.getLogicUnitPreventingSubmit(responses, form, visibleFieldIds)
  ) {
    throw new Error('Submission prevented by form logic')
  }
}

/**
 * Construct parsed responses by checking visibility and injecting questions
 *
 * @param {Object} form
 * @param {Array} bodyResponses
 * @param {Function} modeFilter
 * @returns {Array}
 */
const getParsedResponses = function (form, bodyResponses, modeFilter) {
  const responses = getResponsesForEachField(form, bodyResponses, modeFilter)

  // Create a map keyed by field._id for easier access
  const fieldMap = form.form_fields.reduce((acc, field) => {
    acc[field._id] = field
    return acc
  }, {})

  // Set of all visible fields
  const visibleFieldIds = logicUtil.getVisibleFieldIds(responses, form)
  validatePreventSubmitLogic(form, responses, visibleFieldIds)

  // Validate each field in the form and construct parsed responses for downstream processing
  const parsedResponses = responses.map((response) => {
    const { _id } = response
    // In FormValidator, we have checked that all the form field ids exist, so
    // this wont be null.
    const formField = fieldMap[_id]
    response.isVisible = visibleFieldIds.has(_id)
    validateField(form._id, formField, response)
    // Instance method of base field schema.
    response.question = formField.getQuestion()
    if (formField.isVerifiable) {
      // This is only correct because validateField should have thrown an error
      // if the signature was wrong.
      response.isUserVerified = true
    }

    return response
  })

  return parsedResponses
}

module.exports = {
  getParsedResponses,
}

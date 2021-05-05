const values = require('lodash/values')

// Webpack can't build this for some reason, keep in sync with
// shared/types/form/field
const SPCPFieldTitle = {
  SpNric: 'SingPass Validated NRIC',
  CpUid: 'CorpPass Validated UID',
  CpUen: 'CorpPass Validated UEN',
}

const VerifiedKeys = {
  SpUinFin: 'uinFin',
  CpUen: 'cpUen',
  CpUid: 'cpUid',
}

const CURRENT_VERIFIED_FIELDS = values(VerifiedKeys)

/**
 * Returns a response matching the given type containing the given value.
 * @param {string} type the field type to match
 * @param {any} value the value to insert into the response to be returned
 * @returns the desired response object if type is valid. Else returns null.
 */
const getResponseFromVerifiedField = (type, value) => {
  switch (type) {
    case VerifiedKeys.SpUinFin:
      return {
        question: SPCPFieldTitle.SpNric,
        fieldType: 'nric',
        answer: value,
        // Just a unique identifier for CSV header uniqueness
        _id: SPCPFieldTitle.SpNric,
      }
    case VerifiedKeys.CpUen:
      return {
        question: SPCPFieldTitle.CpUen,
        fieldType: 'textfield',
        answer: value,
        _id: SPCPFieldTitle.CpUen,
      }
    case VerifiedKeys.CpUid:
      return {
        question: SPCPFieldTitle.CpUid,
        fieldType: 'nric',
        answer: value,
        _id: SPCPFieldTitle.CpUid,
      }
    default:
      return null
  }
}

/**
 * Converts a decrypted verified object into an array with the same shape as the
 * current decrypted content to be concatenated with the decrypted content.
 * NOTE: This function assumes verifiedObj is an object with simple string
 * key-value pairs.
 * @param {Object<string, string>} verifiedObj the object to convert
 * @returns the converted array.
 */
const convertToResponseArray = (verifiedObj) => {
  let verifiedResponses = []
  CURRENT_VERIFIED_FIELDS.forEach((fieldType) => {
    if (Object.prototype.hasOwnProperty.call(verifiedObj, fieldType)) {
      const verifiedResponse = getResponseFromVerifiedField(
        fieldType,
        verifiedObj[fieldType],
      )

      if (!verifiedResponse) return
      verifiedResponses.push(verifiedResponse)
    }
  })

  return verifiedResponses
}

/**
 * Processes the decrypted content containing the previously encrypted responses
 * and verified content, and combines them into a single response array.
 * @param {Object} decrypted the decrypted content to process
 * @param {Object[]} decrypted.responses the previously encrypted responses content
 * @param {Object} decrypted.verified the previously encrypted verified content,if it exists
 * @returns {Object[]} the processed content
 */
const processDecryptedContent = (decrypted) => {
  const { responses, verified } = decrypted
  let displayedContent
  // Convert decrypted content into displayable object.
  displayedContent = responses

  if (verified) {
    displayedContent = displayedContent.concat(convertToResponseArray(verified))
  }

  return displayedContent
}

module.exports = processDecryptedContent

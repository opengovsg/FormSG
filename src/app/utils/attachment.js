const fileValidation = require('../../shared/util/file-validation')
const _ = require('lodash')
const { FilePlatforms } = require('../../shared/constants')

/**
 * Checks an array of attachments to see ensure that every
 * one of them is valid. The validity is determined by an
 * internal isInvalidFileExtension checker function, and
 * zip files are checked recursively.
 *
 * @param {File[]} attachments - Array of file objects
 * @return {boolean} Whether all attachments are valid
 */
const attachmentsAreValid = async (attachments) => {
  // Turn it into an array of promises that each resolve
  // to an array of file extensions that are invalid (if any)
  const getInvalidFileExtensionsInZip = fileValidation.getInvalidFileExtensionsInZip(
    FilePlatforms.Server,
  )
  const promises = attachments.map((attachment) => {
    const extension = fileValidation.getFileExtension(attachment.filename)
    if (fileValidation.isInvalidFileExtension(extension)) {
      return Promise.resolve([extension])
    }
    if (extension !== '.zip') return Promise.resolve([])
    return getInvalidFileExtensionsInZip(attachment.content)
  })

  try {
    const results = await Promise.all(promises)
    return _.flattenDeep(results).length === 0
  } catch (err) {
    // Consume error here, all errors should cause attachments to be considered
    // invalid.
    return false
  }
}

/**
 * Adds the attachment's content, filename to each response,
 * based on their fieldId.
 * The response's answer is also changed to the attachment's filename.
 *
 * @param  {Object} req - Express request object
 * @param {File[]} attachments - Array of file objects
 * @return {Void}
 */
const addAttachmentToResponses = (req, attachments) => {
  // Create a map of the attachments with fieldId as keys
  const attachmentMap = attachments.reduce((acc, attachment) => {
    acc[attachment.fieldId] = attachment
    return acc
  }, {})

  if (req.body.responses) {
    // matches responses to attachments using id, adding filename and content to response
    req.body.responses.forEach((response) => {
      if (attachmentMap[response._id]) {
        const file = attachmentMap[response._id]
        response.answer = file.filename
        response.filename = file.filename
        response.content = file.content
      }
    })
  }
}

const areAttachmentsMoreThan7MB = (attachments) => {
  // Check if total attachments size is < 7mb
  const totalAttachmentSize = _.sumBy(attachments, (a) => a.content.byteLength)
  return totalAttachmentSize > 7000000
}

/**
 * Looks for duplicated filenames and changes the filename
 * to for example 1-abc.txt, 2-abc.txt.
 * One of the duplicated files will not have its name changed.
 * Two abc.txt will become 1-abc.txt and abc.txt
 * @param {File[]} attachments - Array of file objects
 * @return {Void}
 */
const handleDuplicatesInAttachments = (attachments) => {
  const names = new Map()

  // fill up the map, the key: filename and value: count
  attachments.forEach((a) => {
    if (names.get(a.filename)) {
      names.set(a.filename, names.get(a.filename) + 1)
    } else {
      names.set(a.filename, 1)
    }
  })

  // Change names of duplicates
  attachments.forEach((a) => {
    if (names.get(a.filename) > 1) {
      const count = names.get(a.filename) - 1
      names.set(a.filename, count)
      a.filename = `${count}-${a.filename}`
    }
  })
}

const mapAttachmentsFromParsedResponses = (responses) => {
  // look for attachments in parsedResponses
  // Could be undefined if it is not required, or hidden
  return responses
    .filter(
      (response) =>
        response.fieldType === 'attachment' && response.content !== undefined,
    )
    .map((response) => ({
      filename: response.filename,
      content: response.content,
    }))
}

module.exports = {
  attachmentsAreValid,
  addAttachmentToResponses,
  areAttachmentsMoreThan7MB,
  handleDuplicatesInAttachments,
  mapAttachmentsFromParsedResponses,
}

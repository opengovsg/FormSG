const formsg = require('@opengovsg/formsg-sdk')()
const { encode: encodeBase64 } = require('@stablelib/base64')

/**
 * Creates a map of { fieldId: encryptedFile }.
 * @param {Object} attachmentsMap Map of { fieldId: unencryptedFile }
 * @param {*} publicKey Form public key
 * @returns {Object}
 */
function getEncryptedAttachmentsMap(attachmentsMap, publicKey) {
  let attachmentPromises = []

  Object.keys(attachmentsMap).forEach((id) => {
    attachmentPromises.push(
      new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = function (event) {
          const fileContentsView = new Uint8Array(event.target.result)

          const encryptedContentsPromise = formsg.crypto
            .encryptFile(fileContentsView, publicKey)
            .then((file) => {
              file.binary = encodeBase64(file.binary)
              return { id, encryptedFile: file }
            })
            .catch(reject)

          resolve(encryptedContentsPromise)
        }
        reader.readAsArrayBuffer(attachmentsMap[id])
      }),
    )
  })

  return Promise.all(attachmentPromises).then((attachmentsArray) => {
    let encryptedAttachmentsMap = {}
    attachmentsArray.forEach((encryptedAttachment) => {
      const { id, encryptedFile } = encryptedAttachment
      encryptedAttachmentsMap[id] = { encryptedFile }
    })

    return encryptedAttachmentsMap
  })
}

/**
 * Extracts a map of { fieldId: file } from a list of answered
 * form fields.
 * @param {Array} formFields Array of all fields in the form
 * @returns {Object}
 */
function getAttachmentsMap(formFields) {
  const attachmentsMap = {}
  formFields.forEach((field) => {
    if (fieldHasAttachment(field)) {
      attachmentsMap[field._id] = field.file
    }
  })
  return attachmentsMap
}

/**
 * Returns true if the field has an attachment uploaded.
 * @param {Object} field
 * @returns {boolean}
 */
function fieldHasAttachment(field) {
  return field.fieldType === 'attachment' && field.fieldValue && field.file
}

module.exports = {
  getEncryptedAttachmentsMap,
  getAttachmentsMap,
  fieldHasAttachment,
}

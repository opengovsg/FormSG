'use strict'
const { fixParamsToUrl } = require('../helpers/util')
const {
  getFileExtension,
  isInvalidFileExtension,
  getInvalidFileExtensionsInZip,
} = require('shared/util/file-validation')
const CryptoJS = require('crypto-js')

angular.module('forms').service('FileHandler', ['$q', '$http', FileHandler])

function FileHandler($q, $http) {
  /**
   * File Transfer services
   */
  const BASE_RESOURCE_URL = '/:formId/adminform'

  /**
   * Image upload
   */
  const IMAGE_RESOURCE_URL = `${BASE_RESOURCE_URL}/images`

  /**
   * @param {File} imageFile
   * @param {String} formId
   * @param {Promise} shouldCancelUpload - On resolve, this will cancel the upload
   */
  this.uploadImage = async function (imageFile, formId, shouldCancelUpload) {
    const fileName = imageFile.name.toLowerCase()
    const fileId = `${formId}-${Date.now()}-${fileName}`
    const uploadFilePromise = uploadFile(
      IMAGE_RESOURCE_URL,
      imageFile,
      formId,
      fileId,
      shouldCancelUpload,
    )
    return uploadFilePromise
  }

  /**
   * Logo upload
   */
  const LOGO_RESOURCE_URL = `${BASE_RESOURCE_URL}/logos`

  /**
   * @param {File} logoFile
   * @param {String} formId
   * @param {Promise} shouldCancelUpload - On resolve, this will cancel the upload
   */
  this.uploadLogo = function (logoFile, formId, shouldCancelUpload) {
    const fileId = `${Date.now()}-${logoFile.name}`
    const uploadFilePromise = uploadFile(
      LOGO_RESOURCE_URL,
      logoFile,
      formId,
      fileId,
      shouldCancelUpload,
    )
    return uploadFilePromise
  }

  /**
   * Upload file to S3. Resolves or rejects deferred promise
   * @param {File} file - To be uploaded
   * @param {String} formId
   * @param {String} fileId
   * @param {Promise} shouldCancelUpload - On resolve, this will cancel the upload
   */
  const uploadFile = async function (
    resourceUrl,
    file,
    formId,
    fileId,
    shouldCancelUpload,
  ) {
    const deferred = $q.defer()
    const formData = new FormData()
    let postData
    let fileMd5Hash

    try {
      fileMd5Hash = await getMd5Hash(file)
      postData = await getPresignedPost(
        resourceUrl,
        { formId },
        fileId,
        fileMd5Hash,
        file.type,
      )
    } catch (err) {
      deferred.reject(err)
      return deferred.promise
    }

    const headers = {
      'Content-Type': undefined, // In order for the boundary to be automatically set
    }
    Object.entries(postData.fields).forEach(([k, v]) => formData.append(k, v))
    formData.append('file', file)

    $http
      .post(postData.url, formData, {
        headers,
        timeout: shouldCancelUpload, // aborts upload when shouldCancelUpload is resolved
      })
      .then(
        function (response) {
          deferred.resolve({
            url: `${response.config.url}/${encodeURIComponent(fileId)}`,
            fileId: encodeURIComponent(fileId),
            fileMd5Hash,
            name: file.name,
            size: file.size,
          })
        },
        function (err) {
          deferred.reject(err)
        },
      )
    return deferred.promise
  }

  /**
   * Obtain a presigned post from S3 for direct upload
   * @param {String} resourceUrl - Endpoint to access
   * @param {Object} params - To populate formId field in resourceUrl
   * @param {String} fileId - Name that will be saved in S3 bucket
   * @param {String} fileMd5Hash - MD5 hash of the file to save. To ensure file is not corrupted while uploading
   * @param {String} fileType - Mime type of the file to save. To enforce file format
   * @returns {Promise} - Promise that contains the presigned post object when resolved
   */
  const getPresignedPost = function (
    resourceUrl,
    params,
    fileId,
    fileMd5Hash,
    fileType,
  ) {
    const deferred = $q.defer()
    const resUrl = fixParamsToUrl(params, resourceUrl)
    $http.post(resUrl, { fileId, fileMd5Hash, fileType }).then(
      function (response) {
        deferred.resolve(response.data)
      },
      function () {
        deferred.reject('Presigned url could not be obtained.')
      },
    )
    return deferred.promise
  }

  /**
   * @param {File} file
   * @returns {String}
   */
  const getMd5Hash = async function (file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader()
      reader.onload = function (event) {
        const arrayBuffer = event.target.result
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)
        const md5HashBase = CryptoJS.MD5(wordArray).toString(
          CryptoJS.enc.Base64,
        )
        resolve(md5HashBase)
      }
      reader.onerror = () => reject(new Error(`Error while hashing!`))
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * File Validation services
   */
  this.getFileExtension = getFileExtension
  this.isInvalidFileExtension = isInvalidFileExtension
  this.getInvalidFileExtensionsInZip = getInvalidFileExtensionsInZip
}

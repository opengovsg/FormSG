'use strict'

const { fixParamsToUrl } = require('../helpers/util')
const CsvGenerator = require('../helpers/CsvGenerator')
const moment = require('moment-timezone')

class FeedbackCsvGenerator extends CsvGenerator {
  constructor(expectedNumberOfRecords) {
    super(expectedNumberOfRecords, 0)
    this.setHeader(['Date', 'Comment', 'Rating'])
  }

  /**
   * Generate a string representing a form feedback CSV line record
   * @param {Object} feedback
   * @param {string} feedback.created
   * @param {string} feedback.comment
   * @param {number} feedback.rating
   */
  addLineFromFeedback(feedback) {
    let createdAt = moment(feedback.created).tz('Asia/Singapore')
    createdAt = createdAt.isValid()
      ? createdAt.format('DD MMM YYYY hh:mm:ss A')
      : feedback.created
    this.addLine([createdAt, feedback.comment, feedback.rating])
  }
}

angular.module('forms').factory('FormFeedback', ['$q', '$http', FormFeedback])

function FormFeedback($q, $http) {
  let resourceUrl = '/api/v3/forms/:formId/feedback'
  const feedbackAdminUrl = '/api/v3/admin/forms/:formId/feedback'
  let feedbackService = {
    postFeedback: function (params, body) {
      let deferred = $q.defer()
      if (body.isPreview) {
        deferred.resolve('Successfully posted feedback.')
      } else {
        let resUrl = fixParamsToUrl(params, resourceUrl)
        $http.post(resUrl, body).then(
          function () {
            deferred.resolve('Successfully posted feedback.')
          },
          function (_errorResponse) {
            deferred.reject('Failed to post feedback.')
          },
        )
      }
      return deferred.promise
    },
    getFeedback: function (params) {
      let resUrl = fixParamsToUrl(params, feedbackAdminUrl)
      let deferred = $q.defer()
      $http.get(resUrl).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function (_errorResponse) {
          deferred.reject('Failed to get feedback.')
        },
      )
      return deferred.promise
    },
    count: function (params) {
      let deferred = $q.defer()
      let resUrl = fixParamsToUrl(params, feedbackAdminUrl) + '/count'
      $http.get(resUrl).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function () {
          deferred.reject('Feedback count cannot be obtained.')
        },
      )
      return deferred.promise
    },
    downloadFeedback: function (params) {
      return this.count(params).then((expectedNumResponses) => {
        let resUrl = `${fixParamsToUrl(params, feedbackAdminUrl)}/download`
        let csvGenerator = new FeedbackCsvGenerator(expectedNumResponses)

        return new Promise(function (resolve, reject) {
          $http.get(resUrl).then((response) => {
            if (response.data === '') {
              return reject(new Error('Feedback data set is too large.'))
            }
            response.data.forEach((feedback) => {
              csvGenerator.addLineFromFeedback(feedback)
            })
            csvGenerator.triggerFileDownload(
              `${params.formTitle}-${params.formId}-feedback.csv`,
            )
            resolve()
          })
        })
      })
    },
  }
  return feedbackService
}

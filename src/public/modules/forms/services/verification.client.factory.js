const { fixParamsToUrl } = require('../helpers/util')
angular.module('forms').factory('Verification', ['$q', '$http', Verification])

function Verification($q, $http) {
  const transactionUrl = '/transaction/:transactionId'
  const post = (resUrl, body) => {
    const deferred = $q.defer()
    $http.post(resUrl, body).then(
      function (response) {
        deferred.resolve(response.data)
      },
      function (errorResponse) {
        deferred.reject(errorResponse.data)
      },
    )
    return deferred.promise
  }
  const service = {
    createTransaction: (body) => {
      const resUrl = '/transaction'
      return post(resUrl, body)
    },
    getTransaction: (params) => {
      const resUrl = fixParamsToUrl(params, transactionUrl)
      const deferred = $q.defer()
      $http.get(resUrl).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function (_errorResponse) {
          deferred.reject('Failed to getTransaction')
        },
      )
      return deferred.promise
    },
    resetFieldInTransaction: (params, body) => {
      const resUrl = fixParamsToUrl(params, `${transactionUrl}/reset`)
      return post(resUrl, body)
    },
    getNewOtp: (params, body) => {
      const resUrl = fixParamsToUrl(params, `${transactionUrl}/otp`)
      return post(resUrl, body)
    },
    verifyOtp: (params, body) => {
      const resUrl = fixParamsToUrl(params, `${transactionUrl}/otp/verify`)
      return post(resUrl, body)
    },
  }
  return service
}

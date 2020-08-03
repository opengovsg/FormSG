'use strict'

angular
  .module('forms')
  .factory('SpcpValidateEsrvcId', ['$q', '$http', SpcpValidateEsrvcId])

function SpcpValidateEsrvcId($q, $http) {
  return function (target, authType, esrvcId) {
    let deferred = $q.defer()
    $http({
      url: '/spcp/validate',
      method: 'GET',
      params: { target, authType, esrvcId },
    }).then(
      function (response) {
        deferred.resolve(response.data)
      },
      function () {
        deferred.reject('Failed to validate esrvcId')
      },
    )
    return deferred.promise
  }
}

'use strict'

angular
  .module('forms')
  .factory('MyInfoValidateEsrvcId', ['$q', '$http', MyInfoValidateEsrvcId])

function MyInfoValidateEsrvcId($q, $http) {
  return function (formId) {
    let deferred = $q.defer()
    $http({
      url: '/myinfo/validate',
      method: 'GET',
      params: { formId },
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

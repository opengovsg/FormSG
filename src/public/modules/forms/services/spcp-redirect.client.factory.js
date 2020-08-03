'use strict'

angular.module('forms').factory('SpcpRedirect', ['$q', '$http', SpcpRedirect])

function SpcpRedirect($q, $http) {
  return function (target, authType, esrvcId) {
    let deferred = $q.defer()
    // The use of the target param as a means of relaying
    // payloads does not fall in accordance to the corppass
    // spec. The target param is supposed to be a URL.
    $http({
      url: '/spcp/redirect',
      method: 'GET',
      params: { target, authType, esrvcId },
    }).then(
      function (response) {
        deferred.resolve(response.data)
      },
      function () {
        deferred.reject('Redirect URL cannot be obtained.')
      },
    )
    return deferred.promise
  }
}

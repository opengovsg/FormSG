'use strict'

angular
  .module('forms')
  .factory('MyInfoRedirect', ['$q', '$http', MyInfoRedirect])

function MyInfoRedirect($q, $http) {
  return function ({ formId }) {
    let deferred = $q.defer()
    $http({
      url: '/myinfo/redirect',
      method: 'GET',
      params: { formId },
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

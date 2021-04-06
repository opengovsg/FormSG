angular.module('users').factory('AdminConsole', ['$q', '$http', AdminConsole])

function AdminConsole($q, $http) {
  return {
    getBillingInfo: function (yr, mth, esrvcId) {
      let deferred = $q.defer()
      $http({
        url: '/api/v3/billings',
        method: 'GET',
        params: { yr, mth, esrvcId },
      }).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function () {
          deferred.reject('Billing information could not be obtained.')
        },
      )
      return deferred.promise
    },
    /**
     * Retrieve example forms for listing
     */
    getExampleForms: function ({
      pageNo,
      searchTerm,
      agency,
      shouldGetTotalNumResults,
    }) {
      let deferred = $q.defer()
      $http({
        url: '/examples',
        method: 'GET',
        params: { pageNo, searchTerm, agency, shouldGetTotalNumResults },
        headers: { 'If-Modified-Since': '0' },
        // disable IE ajax request caching (so search requests don't get cached)
      }).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function (error) {
          deferred.reject(error)
        },
      )
      return deferred.promise
    },
    /**
     * Retrieve a single form for examples
     */
    getSingleExampleForm: function (formId) {
      let deferred = $q.defer()
      $http({
        url: `/examples/${formId}`,
        method: 'GET',
        headers: { 'If-Modified-Since': '0' },
        // disable IE ajax request caching (so search requests don't get cached)
      }).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function (error) {
          deferred.reject(error)
        },
      )
      return deferred.promise
    },
  }
}

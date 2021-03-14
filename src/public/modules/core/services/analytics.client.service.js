const { default: axios } = require('axios')

angular.module('core').factory('Analytics', ['$q', '$http', Analytics])

function Analytics($q, $http) {
  let analyticsService = {
    getFormCount: () => {
      let resUrl = '/analytics/forms'
      let deferred = $q.defer()
      $http.get(resUrl).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function (_errorResponse) {
          deferred.reject('Failed to get form count')
        },
      )
      return deferred.promise
    },

    getUserCount: () => {
      let resUrl = '/analytics/users'
      let deferred = $q.defer()
      $http.get(resUrl).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function (_errorResponse) {
          deferred.reject('Failed to get user count')
        },
      )
      return deferred.promise
    },

    getSubmissionCount: () => {
      let resUrl = '/analytics/submissions'
      let deferred = $q.defer()
      $http.get(resUrl).then(
        function (response) {
          deferred.resolve(response.data)
        },
        function (_errorResponse) {
          deferred.reject('Failed to get submission count')
        },
      )
      return deferred.promise
    },

    getStatistics: () => {
      return axios
        .get('/analytics/statistics')
        .then((response) => response.data)
    },
  }
  return analyticsService
}

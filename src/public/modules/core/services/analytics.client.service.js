const { default: axios } = require('axios')

angular.module('core').factory('Analytics', [Analytics])

function Analytics() {
  let analyticsService = {
    getStatistics: () => {
      return axios
        .get('/analytics/statistics')
        .then((response) => response.data)
    },
  }
  return analyticsService
}

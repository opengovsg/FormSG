'use strict'

const HttpStatus = require('http-status-codes')

// Config HTTP Error Handling
angular.module('users').config([
  '$httpProvider',
  function ($httpProvider) {
    $httpProvider.interceptors.push([
      '$q',
      '$window',
      function ($q, $window) {
        return {
          responseError: function (response) {
            if (response.status === HttpStatus.UNAUTHORIZED) {
              $window.localStorage.removeItem('user')
              $window.localStorage.removeItem('is-logged-in')
              $window.location.assign('/#!/signin')
            } else if (response.status === HttpStatus.FORBIDDEN) {
              $window.location.assign('/#!/forms')
            }
            return $q.reject(response)
          },
        }
      },
    ])
  },
])

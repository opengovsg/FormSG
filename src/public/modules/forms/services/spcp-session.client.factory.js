'use strict'

const PublicFormAuthService = require('../../../services/PublicFormAuthService')

angular
  .module('forms')
  .factory('SpcpSession', ['$timeout', '$window', '$cookies', SpcpSession])

function SpcpSession($timeout, $window, $cookies) {
  let session = {
    userName: null,
    cookieName: null,
    rememberMe: null,
    issuedAt: null,
    cookieNames: {
      SP: 'jwtSp',
      CP: 'jwtCp',
    },
    setUser: function ({ userName, rememberMe, iat, msToExpiry }) {
      session.userName = userName
      session.rememberMe = rememberMe
      session.issuedAt = iat
      if (!rememberMe) {
        $timeout(function () {
          $window.location.reload()
        }, msToExpiry)
        // Refresh page after cookie expiry time
        // Timeout is not set when rememberMe === true because cookie expiry is 30 days
        // i.e. 2592000000 ms which exceeds the maximum delay value of
        // 2147483647 ms (see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout)
      }
    },
    setUserName: function (userName) {
      session.userName = userName
    },
    clearUserName: function () {
      session.userName = undefined
    },
    logout: function (authType) {
      PublicFormAuthService.spcpLogout(authType)
      $cookies.put('isJustLogOut', true)
      $window.location.reload()
    },
    isJustLogOut: function () {
      let val = $cookies.get('isJustLogOut')
      $cookies.remove('isJustLogOut')
      return val
    },
    isLoginError: function () {
      let val = $cookies.get('isLoginError')
      $cookies.remove('isLoginError')
      return val
    },
    isRememberMeSet: function () {
      return session.rememberMe
    },
    getIssuedAt: function () {
      // Send in milliseconds
      return session.issuedAt * 1000
    },
  }
  return session
}

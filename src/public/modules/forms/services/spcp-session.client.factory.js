'use strict'

const {
  getDecodedJwt,
  getStoredJwt,
  logout,
} = require('../../../services/PublicFormAuthService')

angular
  .module('forms')
  .factory('SpcpSession', ['$interval', '$window', '$cookies', SpcpSession])

function SpcpSession($interval, $window, $cookies) {
  let session = {
    userName: null,
    rememberMe: null,
    issuedAt: null,
    intervals: {},
    setUser: function (authType) {
      const decoded = getDecodedJwt(authType)
      if (!decoded) return
      session.userName = decoded.userName
      session.rememberMe = decoded.rememberMe
      session.issuedAt = parseInt(decoded.iat)
      // Every 5 seconds, check if cookie exists and log out if cookie does not exist.
      // Clear stored interval if it already exists.
      if (session.intervals[authType]) {
        $interval.cancel(session.intervals[authType])
      }
      session.intervals[authType] = $interval(
        () => session.checkCookie(authType),
        5000,
      )
    },
    setUserName: function (userName) {
      session.userName = userName
    },
    clearUserName: function () {
      session.userName = undefined
    },
    logout: function (authType) {
      logout(authType, { domain: $window.spcpCookieDomain })
      if (session.intervals[authType]) {
        $interval.cancel(session.intervals[authType])
      }
      $cookies.put('isJustLogOut', true)
      $window.location.reload()
    },
    checkCookie: function (authType) {
      const jwt = getStoredJwt(authType)
      if (!jwt) {
        session.logout(authType)
      }
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

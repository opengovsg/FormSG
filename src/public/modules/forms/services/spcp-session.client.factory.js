'use strict'

const PublicFormAuthService = require('../../../services/PublicFormAuthService')

angular
  .module('forms')
  .factory('SpcpSession', [
    '$interval',
    '$q',
    'Toastr',
    '$window',
    '$cookies',
    SpcpSession,
  ])

function SpcpSession($interval, $q, Toastr, $window, $cookies) {
  let session = {
    userName: null,
    cookieName: null,
    rememberMe: null,
    issuedAt: null,
    cookieNames: {
      SP: 'jwtSp',
      CP: 'jwtCp',
      SGID: 'jwtSgid',
    },
    setUser: function ({ userName, rememberMe, iat, exp }) {
      session.userName = userName
      session.rememberMe = rememberMe
      session.issuedAt = iat
      $interval(() => {
        if (Date.now() > exp * 1000) {
          $window.location.reload()
        }
      }, 5000) // Every 5s, check cookie expiry time and refresh if necessary
    },
    setUserName: function (userName) {
      session.userName = userName
    },
    clearUserName: function () {
      session.userName = undefined
    },
    logout: function (authType) {
      $q.when(PublicFormAuthService.logoutOfSpcpSession(authType))
        .then(() => {
          $cookies.put('isJustLogOut', true)
          $window.location.reload()
        })
        .catch(() => {
          Toastr.error('Failed to log out, please refresh and try again!')
        })
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

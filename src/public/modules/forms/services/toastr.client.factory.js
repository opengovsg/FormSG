'use strict'

let toastr = require('toastr')

angular.module('FormSG').factory('Toastr', ['$filter', Toastr])

function Toastr($filter) {
  const defaultSuccessOptions = {
    newestOnTop: true,
    positionClass: 'toast-top-full-width',
    timeOut: 1500,
    extendedTimeOut: 1500,
    preventDuplicates: true,
  }

  const defaultErrorOptions = {
    newestOnTop: true,
    positionClass: 'toast-top-full-width',
    timeOut: 3000,
    extendedTimeOut: 3000,
    preventDuplicates: true,
  }

  const permanentErrorOptions = {
    newestOnTop: true,
    positionClass: 'toast-top-full-width',
    timeOut: 0,
    extendedTimeOut: 0,
    tapToDismiss: false,
  }

  const successIconHtml =
    '<span class="toast-custom-icon"><i class="bx bx-check"></i></span>'
  const errorIconHtml =
    '<span class="toast-custom-icon"><i class="bx bx-exclamation"></i></span>'

  let toastrNotification = {
    success: function (message, options = {}, title = '') {
      if (!options.skipLinky) {
        message = $filter('linky')(message, '_blank')
      }
      toastr.success(
        message + successIconHtml,
        title,
        Object.assign({}, defaultSuccessOptions, options),
      )
    },
    error: function (message, options = {}, title = '') {
      const linkyfiedMessage = $filter('linky')(message, '_blank')
      toastr.error(
        linkyfiedMessage + errorIconHtml,
        title,
        Object.assign({}, defaultErrorOptions, options),
      )
    },
    permanentError: function (message, options = {}, title = '') {
      $('.toast').remove() // necessary to fix the bug where two permanent toasts are shown
      const linkyfiedMessage = $filter('linky')(message, '_blank')

      toastr.error(
        linkyfiedMessage + errorIconHtml,
        title,
        Object.assign({}, permanentErrorOptions, options),
      )
    },
    remove: function () {
      toastr.clear()
    },
  }
  return toastrNotification
}

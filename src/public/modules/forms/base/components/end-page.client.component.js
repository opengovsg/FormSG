'use strict'

const moment = require('moment-timezone')

angular.module('forms').component('endPageComponent', {
  templateUrl: 'modules/forms/base/componentViews/end-page.html',
  bindings: {
    logoUrl: '@',
    title: '@',
    paragraph: '@',
    buttonText: '@',
    buttonLink: '@',
    authType: '@',
    isAdminPreview: '<',
    colorTheme: '@',
    submissionId: '@',
  },
  controller: ['SpcpSession', '$window', endPageController],
  controllerAs: 'vm',
})

function endPageController(SpcpSession, $window) {
  const vm = this

  vm.timestamp = moment().format('D MMM YYYY, HH:mm')
  vm.userName = SpcpSession.userName
  vm.formLogout = SpcpSession.logout

  vm.customLinkReload = () => {
    if (!vm.buttonLink || vm.buttonLink === $window.location.hash) {
      $window.location.reload()
    } else {
      $window.location.href = vm.buttonLink
    }
  }
}

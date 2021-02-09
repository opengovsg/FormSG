'use strict'

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
  },
  controller: ['SpcpSession', '$window', 'moment', endPageController],
  controllerAs: 'vm',
})

function endPageController(SpcpSession, $window, moment) {
  const vm = this

  vm.timestamp = moment().format('DD MM YYYY, HH:mm')
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

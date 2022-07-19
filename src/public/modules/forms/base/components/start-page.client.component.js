'use strict'

const { FormLogoState } = require('../../../../../../shared/types')

angular.module('forms').component('startPageComponent', {
  templateUrl: 'modules/forms/base/componentViews/start-page.html',
  bindings: {
    logoUrl: '@',
    colorTheme: '@',
    estTimeTaken: '<',
    paragraph: '@',
    logoState: '@',
    formTitle: '@',
    authType: '<',
    myInfoError: '<',
    isAdminPreview: '<',
    isTemplate: '<',
    formLogin: '&',
  },
  controller: ['SpcpSession', 'Toastr', '$window', startPageController],
  controllerAs: 'vm',
})

function startPageController(SpcpSession, Toastr, $window) {
  const vm = this

  vm.formLogout = SpcpSession.logout

  vm.rememberMe = {
    checked: false,
  }

  vm.$onInit = () => {
    $window.document.title = this.formTitle
    vm.userName = SpcpSession.userName
    vm.FormLogoState = FormLogoState

    if (SpcpSession.isJustLogOut()) {
      Toastr.success('You have been logged out')
    }

    if (SpcpSession.isLoginError()) {
      Toastr.error(
        'There was an unexpected error with your log in. Please try again later.',
      )
    }
  }

  vm.$onDestroy = () => {
    $window.document.title = 'FormSG'
  }

  const isInViewport = function () {
    if ($('#start-page-container').length) {
      let elementTop = $('#start-page-container').offset().top
      let elementBottom =
        elementTop + $('#start-page-container').outerHeight() - 80
      let viewportTop = $(window).scrollTop()
      let viewportBottom = viewportTop + $(window).height()
      return elementBottom > viewportTop && elementTop < viewportBottom
    }
  }

  $(window).on('resize scroll', function () {
    if (vm.isAdminPreview) {
      return
    }
    const header = document.getElementById('start-page-header')

    if (!header) {
      return
    }

    const banner = document.getElementById('notification-banner')
    const bannerHeight = banner ? `${banner.offsetHeight + 20}px` : '20px'
    // Update height of header
    header.style.paddingTop = bannerHeight

    if (isInViewport()) {
      header.style.visibility = 'hidden'
    } else {
      header.style.visibility = 'visible'
    }
  })
}

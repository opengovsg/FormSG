'use strict'

angular.module('core').component('bannerComponent', {
  templateUrl: 'modules/core/componentViews/banner.html',
  bindings: {
    message: '<',
  },
  controller: bannerController,
  controllerAs: 'vm',
})

function bannerController() {
  const vm = this

  vm.BANNER_TYPES = {
    info: 'info',
    warn: 'warn',
    error: 'error',
  }

  vm.$onInit = () => {
    if (!vm.message) {
      vm.bannerHidden = true
    } else {
      processBannerMessage()
      vm.bannerHidden = false
    }
  }

  vm.dismissBanner = () => {
    // Slide visible banner out of view and set bannerHidden to true on complete
    angular.element('banner-component:visible').slideUp(400, () => {
      vm.bannerHidden = true
    })
  }

  const processBannerMessage = () => {
    // Retrieve banner type from message, but it is possible that no types
    // exist.
    const vmMessage = vm.message || ''
    const type = vmMessage.split(':').shift().trim().toLowerCase()
    const retrievedType = vm.BANNER_TYPES[type]

    vm.bannerType = retrievedType || vm.BANNER_TYPES.info

    // If there is a type retrieved from message, remove the type encoding in
    // the message.
    // The + 1 is to also remove the semicolon from the encoding
    vm.bannerMessage = retrievedType
      ? vmMessage.substring(vmMessage.indexOf(':') + 1).trim()
      : vmMessage
  }
}

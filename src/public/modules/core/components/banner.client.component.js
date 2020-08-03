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

  vm.$onInit = () => {
    if (!vm.message) {
      vm.bannerHidden = true
    } else {
      vm.bannerHidden = false
    }
  }

  vm.dismissBanner = () => {
    // Slide visible banner out of view and set bannerHidden to true on complete
    angular.element('banner-component:visible').slideUp(400, () => {
      vm.bannerHidden = true
    })
  }
}

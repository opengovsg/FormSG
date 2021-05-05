'use strict'

angular.module('core').component('sgGovtBannerComponent', {
  templateUrl: 'modules/core/componentViews/sg-govt-banner.html',
  controller: ['$location', '$attrs', SgGovtBannerController],
  controllerAs: 'vm',
})

function SgGovtBannerController($location, $attrs) {
  const vm = this

  // Only show banner if the website is a Singapore Government Website.
  // See https://www.designsystem.gov.sg/docs/masthead/.
  vm.showBanner = $location.host().includes('.gov.sg')
  // The x-padding-small attribute maps to paddingSmall instead of xPaddingSmall.
  vm.paddingSmall = Object.prototype.hasOwnProperty.call($attrs, 'paddingSmall')
}

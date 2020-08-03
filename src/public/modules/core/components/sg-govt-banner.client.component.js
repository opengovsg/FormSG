'use strict'

angular.module('core').component('sgGovtBannerComponent', {
  templateUrl: 'modules/core/componentViews/sg-govt-banner.html',
  controller: ['$location', SgGovtBannerController],
  controllerAs: 'vm',
})

function SgGovtBannerController($location) {
  const vm = this

  // Only show banner if the website is a Singapore Government Website.
  // See https://www.designsystem.gov.sg/docs/masthead/.
  vm.showBanner = $location.host().includes('.gov.sg')
}

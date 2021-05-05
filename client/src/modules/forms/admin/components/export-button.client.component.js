angular.module('forms').component('exportButtonComponent', {
  templateUrl:
    'modules/forms/admin/componentViews/export-button.client.view.html',
  bindings: {
    onClick: '&',
    isDisabled: '<',
    isLoading: '<',
    isFullWidth: '<',
  },
  controllerAs: 'vm',
})

angular.module('forms').component('responseComponent', {
  templateUrl:
    'modules/forms/admin/componentViews/response-views/response.client.view.html',
  bindings: {
    field: '<',
    encryptionKey: '<',
  },
  controllerAs: 'vm',
})

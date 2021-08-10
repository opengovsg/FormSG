angular.module('forms').component('formEmailsInputComponent', {
  templateUrl:
    'modules/forms/admin/componentViews/form-emails-input.client.view.html',
  bindings: {
    formData: '=',
    formController: '=',
    saveForm: '&',
  },
  controllerAs: 'vm',
  controller: ['$scope', formEmailsInputController],
})

function formEmailsInputController($scope) {
  const vm = this

  $scope.$watch('vm.formData.emails', (newEmails) => {
    vm.emailInfoMsg =
      newEmails && String(newEmails).split(',').length === 1
        ? 'Recommended: at least 2 recipients to prevent response loss from bounced emails'
        : null
  })
}

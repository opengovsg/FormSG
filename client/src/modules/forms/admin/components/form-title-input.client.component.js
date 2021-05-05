angular.module('forms').component('formTitleInputComponent', {
  templateUrl:
    'modules/forms/admin/componentViews/form-title-input.client.view.html',
  bindings: {
    formData: '=',
    formController: '=',
    saveForm: '&',
    setFocus: '<',
  },
  controllerAs: 'vm',
  controller: formTitleInputController,
})

function formTitleInputController() {
  const vm = this
  vm.focusOnInput = () => {
    if (vm.setFocus) {
      setTimeout(() => {
        angular.element('#settings-name').focus()
      }, 100)
    }
  }
}

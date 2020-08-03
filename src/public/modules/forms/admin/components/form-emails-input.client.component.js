const validator = require('validator')

angular.module('forms').component('formEmailsInputComponent', {
  templateUrl:
    'modules/forms/admin/componentViews/form-emails-input.client.view.html',
  bindings: {
    formData: '=',
    formController: '=',
    saveForm: '&',
  },
  controllerAs: 'vm',
  controller: formEmailsInputController,
})

function formEmailsInputController() {
  const vm = this
  vm.validateEmails = (emails) => {
    if (!emails) {
      vm.emailErrorMsg =
        'You must at least enter one email to receive responses'
      return
    }

    const err = checkForErrors(String(emails).split(','))

    if (err) {
      vm.emailErrorMsg = err
      vm.formController.emailList.$setValidity('text', false)
    } else {
      vm.formController.emailList.$setValidity('text', true)
    }
  }

  function checkForErrors(emails) {
    if (emails.some((email) => isInvalid(email))) {
      return 'Please enter valid email(s) (e.g. me@example.com) separated by commas'
    }
    if (hasDuplicates(emails)) {
      return 'Please remove duplicate emails'
    }
    if (emails.length > 30) {
      return 'Please limit number of emails to 30'
    }
    return null
  }

  function hasDuplicates(emails) {
    const trimmed = emails.map((email) => email.trim())
    return new Set(trimmed).size !== emails.length
  }

  function isInvalid(email) {
    return !validator.isEmail(email.trim())
  }
}

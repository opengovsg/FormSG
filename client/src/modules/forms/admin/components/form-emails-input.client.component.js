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

  vm.validateEmails = (emails) => {
    const emailsToCheck = emails ? String(emails).split(',') : undefined
    vm.emailErrorMsg = checkForErrors(emailsToCheck)
    vm.formController.emailList.$setValidity('text', !vm.emailErrorMsg)
  }

  function checkForErrors(emailsToCheck) {
    if (!emailsToCheck) {
      return 'You must at least enter one email to receive responses'
    }

    const emails = String(emailsToCheck).split(',')

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

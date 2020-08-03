angular
  .module('forms')
  .controller('ActivateFormController', [
    '$uibModalInstance',
    '$timeout',
    'SpcpValidateEsrvcId',
    'externalScope',
    ActivateFormController,
  ])

function ActivateFormController(
  $uibModalInstance,
  $timeout,
  SpcpValidateEsrvcId,
  externalScope,
) {
  let { updateFormStatusAndSave, checks } = externalScope

  const vm = this

  const checkEnum = Object.freeze({ default: 0, esrvcId: 1, password: 2 })
  vm.checkEnum = checkEnum
  vm.checkStatus = checkEnum.default
  vm.remainingChecks = Object.keys(checks).length // Decrement for every successful check

  // 0 - Check not yet initialized / completed
  // 1 - Loading SPCP website to check E-Service Id
  // 2 - Check is completed
  vm.esrvcIdStatus = 0

  // 0 - Not yet saved
  // 1 - Is saving
  // 2 - Is saved
  vm.savingStatus = 0

  vm.publicKey = _.get(checks, 'passwordParams.publicKey', '') // Pass it to verify-secret-key directive

  vm.closeActivateFormModal = function () {
    $uibModalInstance.close()
  }

  vm.initializeChecks = function () {
    const { eSrvcIdParams, passwordParams } = checks
    if (eSrvcIdParams) {
      vm.checkStatus = checkEnum.esrvcId // Initiate the check for e-service id first automatically
      checkESrvcId(eSrvcIdParams).then((isEsrvcIdValid) => {
        if (isEsrvcIdValid) {
          $timeout(() => {
            vm.remainingChecks--
          }, 500)
          if (passwordParams) {
            // If we also need to check password
            $timeout(() => {
              vm.checkStatus = checkEnum.password // Move to the view for checking password
            }, 1000)
          } else {
            // Save
            vm.savingStatus = 1
            updateFormStatusAndSave().then(() => {
              vm.savingStatus = 2
            })
          }
        }
        // If the e-service id is not valid, don't do anything, let the user close the modal manually
      })
    } else if (!eSrvcIdParams && passwordParams) {
      vm.checkStatus = checkEnum.password // password only
      // Check is initiated by user uploading a file
    }
  }

  const checkESrvcId = ({ target, authType, esrvcId }) => {
    const updateDisplay = (error, success, waitDuration = 500) => {
      $timeout(() => {
        if (error) vm.esrvcIdError = error
        if (success) vm.esrvcIdSuccess = success
        vm.esrvcIdStatus = 2
      }, waitDuration)
    }

    $timeout(() => {
      vm.esrvcIdStatus = 1
    })

    if (authType === 'SP' && esrvcId !== '') {
      // Only validate for Singpass. CorpPass doesn't return any error page even with the wrong e-service id
      return SpcpValidateEsrvcId(target, authType, esrvcId)
        .then((response) => {
          if (response.isValid) {
            updateDisplay(null, { authType, esrvcId })
          } else {
            updateDisplay(
              { authType, esrvcId, errorCode: response.errorCode },
              null,
            )
          }
          return response.isValid
        })
        .catch(() => {
          updateDisplay({ authType, esrvcId }, null)
          return false
        })
    } else if (authType === 'CP' && esrvcId !== '') {
      updateDisplay(null, { authType, esrvcId }, 0)
      return Promise.resolve(true)
    }
  }

  vm.passwordCallback = function ({ encryptionKey }) {
    if (encryptionKey !== null) {
      vm.remainingChecks--
      vm.savingStatus = 1
      updateFormStatusAndSave('Congrats! Your form has gone live.').then(() => {
        vm.savingStatus = 2
        vm.closeActivateFormModal()
      })
    }
  }
}

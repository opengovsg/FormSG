angular
  .module('forms')
  .directive('verifySecretKeyDirective', [
    'FormSgSdk',
    verifySecretKeyDirective,
  ])

function verifySecretKeyDirective(FormSgSdk) {
  return {
    templateUrl: (elem, attr) => {
      const isActivationModal = attr.isActivationModal === 'true'
      if (isActivationModal === true) {
        return 'modules/forms/admin/directiveViews/verify-secret-key-activation.client.view.html'
      } else {
        return 'modules/forms/admin/directiveViews/verify-secret-key.client.view.html'
      }
    },
    restrict: 'E',
    scope: {
      header: '@',
      headerHighlight: '@',
      subtitle: '@',
      btnText: '@',
      publicKey: '<',
      callback: '<',
      savingStatus: '<',
    },
    controller: [
      '$scope',
      'Toastr',
      function ($scope, Toastr) {
        $scope.secretKey = { value: '' }
        const createEncryptionKey = (publicKey, secretKey) => {
          const secretKeyTrimmed = secretKey.trim()
          if (FormSgSdk.crypto.valid(publicKey, secretKeyTrimmed)) {
            return {
              publicKey,
              secretKey: secretKeyTrimmed,
            }
          }
          return null
        }

        const getErrorMessage = (error) => {
          switch (error) {
            case null:
              return ''
            case 'base64':
              return 'Secret key contains invalid characters. Please try again.'
            case 'pattern':
              return 'Only files ending in .txt are allowed. Please try again.'
            case 'reader-error':
              return 'File could not be read. Please try again.'
            case 'reader-abort':
              return 'File could not be read. Please try again.'
            case 'invalid-key':
              return 'Secret Key error. Please try again.'
            default:
              return 'An error occurred. Please try again.'
          }
        }

        $scope.isAcknowledgementWrong = () => {
          const inputAcknowledgement = $scope.inputAcknowledgement
          if (!inputAcknowledgement) return true
          return (
            inputAcknowledgement
              .toLowerCase()
              .replace(/\./g, '')
              .replace(/  +/g, ' ')
              .trim() !== 'i have shared my secret key with a colleague'
          )
          //Allow regardless of whether user types in upper / lowercase, ignore full stops and multiple spaces
        }

        $scope.validateSecretKey = (secretKey) => {
          if (!secretKey) {
            Toastr.error(getErrorMessage('invalid-key'))
            return
          }

          if (!/^[a-zA-Z0-9/+]+={0,2}$/.test(secretKey)) {
            Toastr.error(getErrorMessage('base64'))
            return
          }

          const encryptionKey = createEncryptionKey($scope.publicKey, secretKey)
          if (!encryptionKey) {
            Toastr.error(getErrorMessage('invalid-key'))
          }
          $scope.callback({ encryptionKey })
        }

        $scope.uploadFormKey = (file, errFiles) => {
          if (errFiles.length > 0) {
            Toastr.error(getErrorMessage(errFiles[0].$error))
          } else if (file != null) {
            let reader = new FileReader()
            reader.onload = (event) => {
              $scope.$apply(() => {
                $scope.secretKey.value = event.target.result
              })
            }
            reader.onerror = () => Toastr.error(getErrorMessage('reader-error'))
            reader.onabort = () => Toastr.error(getErrorMessage('reader-abort'))
            reader.readAsText(file)
          }
        }
      },
    ],
  }
}

angular.module('core').factory('FormSgSdk', ['$window', FormSgSdkService])

function FormSgSdkService($window) {
  const formsgSdk = require('@opengovsg/formsg-sdk')({
    mode: $window.formsgSdkMode,
  })

  return formsgSdk
}

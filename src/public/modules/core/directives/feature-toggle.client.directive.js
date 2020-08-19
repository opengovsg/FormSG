'use strict'

angular.module('core').directive('featureToggle', ['Features', featureToggle])

function featureToggle(Features) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      Features.getfeatureStates().then(function (response) {
        if (!response[attrs.featureName]) {
          element.remove()
        }
        scope.feature = response
      })
    },
  }
}

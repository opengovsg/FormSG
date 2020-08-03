'use strict'

angular.module('core').factory('Features', FeatureFactory)

function FeatureFactory($resource) {
  let _states = null
  let service = {}

  service.getfeatureStates = async function () {
    if (_states) {
      return _states
    } else {
      _states = await $resource('/frontend/features').get().$promise
      return _states
    }
  }

  return service
}

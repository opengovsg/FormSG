'use strict'

angular.module('core').factory('Features', ['$resource', featureFactory])

function featureFactory($resource) {
  const service = {
    states: '',
    getFeatureStates: async () => {
      if (this.states) {
        return this.states
      } else {
        this.states = await $resource('/api/v3/client/features').get().$promise
        return this.states
      }
    },
  }
  return service
}

angular.module('forms').directive('ngOnload', ngOnload)

function ngOnload() {
  return {
    restrict: 'A',
    scope: {
      callback: '&ngOnload',
    },
    link: (scope, element, _attrs) => {
      element.on('load', (event) => scope.callback({ event: event }))
    },
  }
}
